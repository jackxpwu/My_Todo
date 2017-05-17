$(document).ready(function(){
    'use strict';
    var $form_add_task = $('.add-task'),  /*form表单*/
        task_list = [],
        $body = $('body'),
        $window = $(window);                     /*任务列表（内存）*/
    init();
    //pop();
    function init(){                        /*内存中更新task_list*/
        //store.clear();
        //$('.task-list').html('');
        task_list = store.get('task_list') || [];
        if(task_list.length){
            render_task_list();
        }
        console.log(task_list);
    }
    function pop(arg){
        if(!arg)
            console.error('pop content is required!');
        var $box,
            $mask,
            $content,
            $confirm,
            $confirmed,
            $cancel,
            $btn,
            $dtd,
            $timer;
        $dtd = $.Deferred();//jquery() Deferred方法,处理耗时的异步操作，deffered对象就是jquery的回调函数的解决方法

        $box = $('<div>'+
                    '<div class="pop-content">' + arg + '</div>'+
                    '<div class="pop-btn">'+
                        '<span class="pop-del">确定</span>' +
                        '<span class="pop-cancel">取消</span>'+
                    '</div>'+
                '</div>')
            .css({
                width:'300',
                height:'100',
                backgroundColor:'#7eaac8',
                position:'fixed',
                borderRadius:'3px',
                boxShadow:'1px 1px 1px #333'
            });
        $content = $box.find('.pop-content').css({
            'padding':'5px',
            'font-size':'17px',
            'text-align':'center',
            'margin':'10px'
        });
        $confirm = $box.find('.pop-del').css({
            'display':'block',
            'width':'100px',
            'padding':'5px',
            'background-color':'#ffb871',
            'float':'left',
            'text-align':'center',
            'cursor':'pointer',
            'border-radius':'3px'

        });
        $cancel = $box.find('.pop-cancel').css({
            'display':'block',
            'width':'100px',
            'padding':'5px',
            'float':'right',
            'background-color':'#FFE9B4',
            'text-align':'center',
            'cursor':'pointer',
            'border-radius':'3px'
        });
        $btn = $box.find('.pop-btn').css({
            'display':'block',
            'width':'250px',
            'margin':'10px auto'
        });

        $timer = setInterval(function(){
            if($confirmed !== undefined){
                $dtd.resolve($confirmed);//将dtd对象改变成已完成状态
                clearInterval($timer);
                remove_pop();
            }
        },50)

        $mask = $('<div></div>')
            .css({
                backgroundColor:'#9aa3aa',
                opacity:'.5',
                position:'fixed',
                top:0,
                left:0,
                bottom:0,
                right:0
            });

        $confirm.on('click',function(){
            $confirmed = true;
        });

        $cancel.on('click',function(){
            $confirmed = false;
        });

        $mask.on('click',function(){
            $confirmed = false;
        });

        $mask.appendTo($body);
        $box.appendTo($body);
        function $ajust_box_position(){
            var $box_width,
                $box_height,
                $height,
                $width,
                $move_x,
                $move_y;
            $box_width = $box.width();
            $box_height = $box.height();
            $height = $window.height();
            $width = $window.width();
            $move_x = ($width - $box_width) / 2;
            $move_y = ($height - $box_height) / 2 -20;
            $box.css({
                left : $move_x,
                top : $move_y
            });
        }
        function remove_pop(){
            $box.remove();
            $mask.remove();
        }


        $window.on('resize',function(){
            $ajust_box_position();
        });
        $window.resize();
        return $dtd.promise();//返回的不是原来的dtd对象，是另一个与执行状态无关的dtd对象；；只开放与改变执行状态无关的方法，如done()、fail()
    }
    $form_add_task.on('submit',function(event){
        var new_task = {};                 /*新增任务*/
        event.preventDefault();
        new_task.content = $(this).find('input[name=content]').val();
        if(!new_task.content) return;
        if(add_task(new_task)){
            render_task_list();
        }
        $(this).find('input[name=content]').val(null);
    });
    function add_task(new_task){            /*内存中新增new_task*/
        task_list.push(new_task);            /*注意作用域，new_task为全局变量时，意味着每次push进数组的都是一个变量*/
        store.set('task_list',task_list);
        return true;
    }

    function listen_delete_task(){                  /*监听删除事件*/
        $('.delete').on('click',function(){
            var del = {};
            del = $(this).parent().parent();
            //console.log(del.data('index'));     /*jquery的data()方法*/
            //confirm('是否删除？') ? delete_task(del.data('index')) : null;
            pop('确定删除吗？').then(function(r){
                //console.log('r:',r);
                r ? delete_task(del.data('index')) : null;
            });//jquery的then()方法相当于done()和fail()方法的合并
        });
    }
    function delete_task(index){
        if(index === undefined || !task_list[index]) return;
        delete task_list[index];
        //store.remove(task_list[index]);
        store.set('task_list',task_list);
        render_task_list();
        return true;
    }
    function render_task_list(){            /*页面中更新list*/
        var $task = {};
        $('.task-list').html('');
        var complete_task = [];
        for(var i = 0;i<task_list.length;i++){
            if(task_list[i] && task_list[i].complete){
                complete_task[i] = task_list[i];
            }else{
                $task = render_task_tpl(task_list[i],i);
                $('.task-list').prepend($task);
            }
        }
        for(var j = 0;j<complete_task.length;j++){
            $task = $(render_task_tpl(complete_task[j],j));
            if(!$task) continue;
                $task.addClass('completed');
                $('.task-list').append($task);
        }
        listen_delete_task();
        listen_detail_task();
        listen_checkbox_complete();
        remind_task_check();
    }
    function remind_task_check(){
        var current_timestamp,task_timestamp;
        setInterval(function(){
            for(var i = 0;i<task_list.length;i++){
                var item = store.get("task_list")[i];
                if(!item || !item.date || item.informed) continue;
                task_timestamp = (new Date(item.date)).getTime();
                current_timestamp = (new Date()).getTime();     /*获取距离某规定时间的毫秒数，是一串序列号，通常用来比较时间*/
                //console.log('task_list'+i+':',task_list[i].content);
                if(current_timestamp - task_timestamp >= 1){
                    update_task(i,{informed:true});
                    show_message(item.content);

                }
            }
        },1000)         /* ms */
    }
    function show_message(content) {
        $('.msg').html(content);
        $('.mindY').show();
        click_msg();
    }
    function click_msg(){
        $('.know').click(function(){
            $('.mindY').hide();
            //console.log(1,1);
        });
    }
    function render_task_tpl(data,index){            /*页面中更新item*/
        //console.log(index);
        if(!data || index === undefined) return;   /* 如果不存在task_list[i]、或者不存在i */
        var list_item_tpl =
            '<div class="task-item" data-index="'+index+'">' +
            '<span>' + '<input '+(data.complete ? 'checked' : '')+' class="complete" type="checkbox">' + '</span>' +
            '<span class="task-content">' + data.content + '</span>' +
            '<span class="fr">' +
                '<span class="delete"> 删除 </span>' +
                '<span class="detail"> 详情 </span>' +
            '</span>' +
            '</div>';
        return list_item_tpl;
    }

    function listen_detail_task(){                  /*监听detail事件*/
        var index;
        $('.detail').on('click',function(){
            index = $(this).parent().parent().data('index');
            show_task_detail(index);
        });
        $('.task-item').on('dblclick',function(){
            index = $(this).data('index');
            show_task_detail(index);
        });
    }

    $('.task-detail-mask').on('click',hide_task_detail);

    function show_task_detail(index){
        render_task_detail(index);
        $('.task-detail-mask').show();
        $('.task-detail').show();
        render_detail(index);
    }
    function hide_task_detail(){
        $('.task-detail-mask').hide();
        $('.task-detail').hide();
    }
    function render_task_detail(index){            /*渲染task_detail的详细信息*/
        if(index === undefined || !task_list[index]) return;
        var task_content = {},
            $tpl={};
        task_content = task_list[index];
        $tpl = '<form>' +
                '<div class="content">' + task_content.content + '</div>' +
                '<input class="detail_content" style="display:none" name="content" autocomplete="off">' +
                '<div class="desc">' +
                    '<textarea name="desc"></textarea>' +
                '</div>' +
                '<div class="remind">' +
                    '<p> 提醒时间</p>' +
                    '<input id="datetimepicker" name="date" type="text" value="'+ (task_list[index].date ? task_list[index].date : task_list[index].date) +'">' +
                    '<button class="remindSub" type="submit">submit</button>' +
                '</div>' +
              '</form>';
        $('.task-detail').html(null);           /*$('.task-detail').append(tpl);*/
        $('.task-detail').html($tpl);
        $('#datetimepicker').datetimepicker();
        $('.content').on('dblclick',function(){
            $('.content').hide();
            $('input[name=content]').show();
        });

        var $form = $('.task-detail').find('form');
        $form.on('submit',function(e){
            e.preventDefault();
            var data = {};
            data.content = $(this).find('input[name=content]').val();
            data.desc = $(this).find('textarea[name=desc]').val();
            data.date = $(this).find('#datetimepicker').val();
            hide_task_detail();
            update_task(index,data);
        });
    }
    function update_task(index,data){
        if( index === undefined || !task_list[index]) return;
        task_list[index] = $.extend({},task_list[index],data);
        store.set('task_list',task_list);
        //console.log('task_list[index]:',task_list[index]);
        render_task_list();
    }
    function render_detail(index){
        $('.content').val(task_list[index].content);
        $('.detail_content').val(task_list[index].content);
        $('textarea[name=desc]').val(task_list[index].desc);
        $('input[name=date]').val(task_list[index].date);
    }

    function listen_checkbox_complete(){
        $('.complete').on('click',function(){
            var index = $(this).parent().parent().data('index');
            var $is_complete = $(this).is(":checked");
            if($is_complete){
                task_list[index].complete = true;
            }else{
                task_list[index].complete = false;
            }
            update_task(index,task_list[index].complete);
        });
    }
});
