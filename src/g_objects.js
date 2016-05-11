/**
 * Created by PKQ874 on 05.04.2016.
 */
//line
function Line(start, end, colour)
{
    var line_width = 10;

    this.draw = function(v_plane)
    {
        var ctx = v_plane.get_context_2d();
        var s0 = v_plane.physical_to_screen(start);
        var s1 = v_plane.physical_to_screen(end);

        ctx.beginPath();
        ctx.lineWidth = line_width;
        ctx.lineCap = "butt";
        ctx.strokeStyle = colour;
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.stroke();
    };
}

//rectangle
function Rectangle(r, colour)
{
    var line_width = 3;

    var s0 = {x: r.left, y: r.top};
    var s1 = {x: r.right, y: r.top};
    var s2 = {x: r.right, y: r.bottom};
    var s3 = {x: r.left, y: r.bottom};

    var vertices = [s0, s1, s2, s3];

    var n_vertices = vertices.length;
    var p_list = new Array(n_vertices);

    this.draw = function(v_plane)
    {
        var ctx = v_plane.get_context_2d();
        var i;
        for (i = 0; i < n_vertices; i++)
        {
            p_list[i] = v_plane.physical_to_screen(vertices[i]);
        }

        ctx.beginPath();
        ctx.lineWidth = line_width;
        ctx.lineCap = "butt";
        ctx.strokeStyle = colour;
        var p = p_list[n_vertices - 1];
        ctx.moveTo(p.x, p.y);
        for(i = 0; i < n_vertices; i++)
        {
            p = p_list[i];
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }
}

//selection circle
function G_selection_circle(p, screen_radius, colour)
{
    var line_width = 1;

    this.draw = function(v_plane)
    {
        var ctx = v_plane.get_context_2d();

        var center = v_plane.physical_to_screen(p);

        ctx.beginPath();
        ctx.lineWidth = line_width;
        ctx.strokeStyle = colour;
        ctx.arc(center.x, center.y, screen_radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

//list_of_samples
function G_sample_list(v, colour, style)
{
    var line_width = 2;
    style = style || 'dots';

    var style_handles = [];
    style_handles['dots'] = {init: init_dot_draw, draw: draw_dot, finish: finish_dot_draw};
    style_handles['lines'] = {init: init_line_draw, draw: draw_line, finish: finish_line_draw};

    var start_index;
    var end_index;
    var win_left;
    var win_right;

    function init_dot_draw(ctx, p)
    {
        ctx.moveTo(p.x, p.y);
        ctx.fillStyle = colour;
    }

    function draw_dot(ctx, p)
    {
        ctx.fillRect(p.x, p.y, line_width, line_width);
    }

    function finish_dot_draw(ctx)
    {

    }

    function init_line_draw(ctx, p)
    {
        ctx.beginPath();
        ctx.lineWidth = line_width;
        ctx.strokeStyle = colour;
        ctx.moveTo(p.x, p.y);
    }

    function draw_line(ctx, p)
    {
        ctx.lineTo(p.x, p.y)
    }

    function finish_line_draw(ctx)
    {
        ctx.stroke();
    }

    function smooth(v)
    {
        var i = 0;
        var result = [];
        if (i < v.length)
        {
            var x = Math.round(v[i].x);
            var s = v[i].y;
            var n = 1;
            for(++i; i < v.length; i++)
            {
                var cur_x = Math.round(v[i].x);
                if (cur_x == x)
                {
                    s += v[i].y;
                    n++;
                }
                else
                {
                    result.push({x: x, y: s / n});
                    x = cur_x;
                    s = v[i].y;
                    n = 1;
                }
            }
            result.push({x: x, y: s / n});
        }
        return result;
    }

    function filter(v_plane)
    {
        var w = v_plane.get_physical_window();
        if (win_left == undefined)
        {
            start_index = 0;
            while ((start_index < v.length - 1) && (v[start_index].x < w.left))
            {
                start_index++
            }

            end_index = v.length - 1;
            while ((end_index > 0) && (v[end_index].x > w.right))
            {
                end_index--
            }

        }
        else
        {
            if (win_left < w.left)
            {
                while ((start_index < v.length - 1) && (v[start_index].x < w.left))
                {
                    start_index++
                }
            }
            else
            {
                while ((start_index > 0) && (v[start_index].x > w.left))
                {
                    start_index--
                }
            }

            if (win_right > w.right)
            {
                while ((end_index > 0) && (v[end_index].x > w.right))
                {
                    end_index--
                }
            }
            else
            {
                while ((end_index < v.length - 1) && (v[end_index].x < w.right))
                {
                    end_index++
                }
            }
        }
        win_left = w.left;
        win_right = w.right;
        return v.slice(start_index, end_index + 1);
    }

    this.draw = function(v_plane)
    {
        var ctx = v_plane.get_context_2d();

        var win_v = filter(v_plane);
        var i;
        var p = new Array(win_v.length);
        for (i = 0; i < win_v.length; i++)
        {
            p[i] = v_plane.physical_to_screen(win_v[i]);
        }

        var screen_p = smooth(p);

        if (screen_p.length > 0)
        {
            var draw_handle = style_handles[style];

            draw_handle.init(ctx, screen_p);
            for (i = 0; i < screen_p.length; i++) {
                draw_handle.draw(ctx, screen_p[i]);
            }
            draw_handle.finish(ctx)
        }
    };

    this.check_selection = function(p, max_delta)
    {
        var i;
        var result = false;

        for (i = start_index; i <= end_index; i++)
        {
            var dx = Math.abs(v[i].x - p.x);
            var dy = Math.abs(v[i].y - p.y);
            if ((max_delta > dx) && (max_delta > dy))
            {
                max_delta = dx > dy ? dx : dy;
                result = v[i];
            }
        }

        return result;
    }

}

//polynomial
function G_polynomial(coefficients, colour, limits)
{
    var pixel_step = 1;

    function calc_polynomial(x)
    {
        var s = coefficients[0];
        for (var i = 1; i < coefficients.length; i++)
        {
            s = s*x + coefficients[i];
        }
        return s;
    }

    this.draw = function(v_plane)
    {
        var win = v_plane.get_physical_window();
        var from = win.left;
        var to = win.right;

        if (limits)
        {
            if (limits.left > from)
            {
                from = limits.left;
            }
            if (limits.right < to)
            {
                to = limits.right;
            }
        }

        var ctx = v_plane.get_context_2d();
        var screen_from = get_screen_point(from);
        var screen_to = get_screen_point(to);
        var screen_span = screen_to.x - screen_from.x;



        var n = screen_span / pixel_step + 1;
        var dx = (to - from) / (n - 1);

        function get_screen_point(x)
        {
            var y = calc_polynomial(x);
            return v_plane.physical_to_screen({x: x, y: y});
        }

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineCap = "butt";
        ctx.strokeStyle = colour;
        ctx.moveTo(screen_from.x, screen_from.y);
        for (var i = 1; i < n; i++)
        {
            var s = get_screen_point(from + dx * i);
            ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
    };
}


