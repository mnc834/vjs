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

//polynomial
function Polynomial_g_object(coefficients, colour)
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
        var ctx = v_plane.get_context_2d();
        var win = v_plane.get_physical_window();
        var size = v_plane.get_screen_size();

        var n = size.width / pixel_step + 1;
        var dx = (win.right - win.left) / (n - 1);

        function get_screen_point(x)
        {
            var y = calc_polynomial(x);
            return v_plane.physical_to_screen({x: x, y: y});
        }

        var s = get_screen_point(win.left);
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineCap = "butt";
        ctx.strokeStyle = colour;
        ctx.moveTo(s.x, s.y);
        for (var i = 1; i < n; i++)
        {
            s = get_screen_point(win.left + dx * i);
            ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
    };
}


