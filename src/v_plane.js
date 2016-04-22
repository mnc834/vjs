function V_plane(canvas) {
    // storing the reference to an instance
    var instance = this;

    //getting canvas's parameters
    var ctx = canvas.getContext("2d");

    //current scales (vertical and horizontal)
    var cur_scale = {x: 1, y: 1};

    //scale processor
    var scale_processor = default_scale_processor;
    function default_scale_processor(cur_scale, d_scale)
    {
        var ratio = 1 + d_scale;
        return {x: cur_scale.x * ratio, y : cur_scale.y * ratio}
    }

    //screen coordinates of the point with physical coordinates (0, 0)
    //screen coordinates origin from top left corner of the canvas
    var x0 = canvas.width / 2;
    var y0 = canvas.height / 2;

    //drag object
    //pressed - in a mouse button is pressed down
    //activated - if drag is started
    //{x,y} screen coordinates of the point where the mouse button is pressed
    var drag = {pressed: false, activated: false, x : undefined, y : undefined};

    //list of on click listeners functions
    var on_click_listener_list = [];

    //list of graphical objects (callback functions)
    var g_object_list = [];

    //id counter of the graphical objects
    var g_object_counter = 0;

    //getting mouse coordinates in canvas context
    function get_mouse_pos(evt)
    {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    //canvas event listeners callbacks
    function scale_fun(e)
    {
        //getting physical and screen coordinates of the point
        var p_screen = get_mouse_pos(e);
        var p_physical = instance.screen_to_physical(p_screen);

        //check for detail so Opera uses that instead of wheelDelta
        var delta = e.wheelDelta ? e.wheelDelta : -e.detail * 120;
        var d_scale = delta / 1000;
        var new_scale = scale_processor(cur_scale, d_scale);
        cur_scale = new_scale;
        x0 = p_screen.x - p_physical.x * new_scale.x;
        y0 = p_screen.y + p_physical.y * new_scale.y;
        instance.draw();
    }

    function down_fun (e)
    {
        drag.x = e.clientX;
        drag.y = e.clientY;
        drag.pressed = true;
        drag.activated = false;
    }

    function move_fun(e)
    {
        if (true == drag.pressed) {
            var dx = e.clientX - drag.x;
            var dy = e.clientY - drag.y;
            drag.x = e.clientX;
            drag.y = e.clientY;
            drag.activated = true;
            x0 += dx;
            y0 += dy;
            instance.draw()
        }
    }

    function up_fun()
    {
        drag.pressed = false;
    }

    function leave_fun()
    {
        drag.pressed = false;
    }

    function click_fun(e)
    {
        if (false == drag.activated)
        {
            var pos = get_mouse_pos(e);
            var t = {};
            t.x_screen = pos.x;
            t.y_screen = pos.y;
            var pos_physical = instance.screen_to_physical(pos);
            t.x = pos_physical.x;
            t.y = pos_physical.y;
            var i;
            for (i = 0; i < on_click_listener_list.length; i++)
            {
                on_click_listener_list[i](t);
            }
        }
    }

    //privileged methods
    this.add_on_click_listener = function(on_click_listener)
    {
        on_click_listener_list.push(on_click_listener);
    };

    this.add_g_object = function(g_object)
    {
        var id = g_object_counter++;
        g_object_list.push({id: id, g_object: g_object});
        this.draw();
        return id;
    };

    this.remove_g_object = function(id)
    {
        var filter_fun = function(g_obj_rec)
        {
            return id != g_obj_rec.id;
        };
        g_object_list = g_object_list.filter(filter_fun);
        this.draw();
    };

    //setting scale processor
    this.set_scale_processor = function(fun)
    {
        scale_processor = fun
    };

    this.get_context_2d = function()
    {
        return ctx;
    };

    this.get_screen_size = function()
    {
        return {
            width: canvas.width,
            height: canvas.height
        };
    };

    this.get_physical_window = function()
    {
        var size = this.get_screen_size();
        var p0 = this.screen_to_physical({x: 0, y: 0});
        var p1 = this.screen_to_physical({x: size.width, y:size.height});

        return {
            top: p0.y,
            left: p0.x,
            bottom: p1.y,
            right: p1.x
        };
    };

    this.physical_to_screen = function(p)
    {
        var screen_x = x0 + p.x * cur_scale.x;
        var screen_y = y0 - p.y * cur_scale.y;

        return {
            x: screen_x,
            y:screen_y
        };
    };

    this.screen_to_physical = function(p)
    {
        var physical_x = (p.x - x0) / cur_scale.x;
        var physical_y = (y0 - p.y) / cur_scale.y;
        return {
            x: physical_x,
            y: physical_y
        };
    };

    //makes a point with physical coordinates p.x p.y to be in the
    //center of the screen
    this.move_screen_center = function(p)
    {
        //updating x0 and y0 (reverse to physical_to_screen)
        x0 = canvas.width / 2 - p.x * cur_scale.x;
        y0 = canvas.height / 2 + p.y * cur_scale.y;
        this.draw();
    };

    this.draw = function()
    {

        var size = this.get_screen_size();
        var width = size.width;
        var height = size.height;

        ctx.clearRect(0, 0, width, height); // clear canvas

        //invoking graphical objects draw functions
        var i;
        for (i = 0; i < g_object_list.length; i++)
        {
            g_object_list[i].g_object.draw(this);
        }

        //axis
        //changing composite operation to xor for the axis
        var cur_composite_operation = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = "xor";

        //axis parameters
        ctx.lineWidth = 1;
        ctx.lineCap = "square";
        ctx.strokeStyle = "#000000";

        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.lineTo(width, y0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0, height);
        ctx.stroke();

        //restoring composite operation
        ctx.globalCompositeOperation = cur_composite_operation;

    };

    //setting canvas's event listeners
    //FF doesn't recognize mousewheel as of FF3.x
    var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
    canvas.addEventListener(mousewheelevt, scale_fun, false);
    canvas.addEventListener("mousedown", down_fun, false);
    canvas.addEventListener("mousemove", move_fun,false);
    canvas.addEventListener("mouseup", up_fun, false);
    canvas.addEventListener("mouseleave", leave_fun, false);
    canvas.addEventListener("click", click_fun, false);

    //initial display
    this.draw();
}