const MAX_ITERATIONS = 30,
    INITIAL_CONSTANT = [-0.99, 0.3],
    TEMP_SIZE = 350;
let constant, tempCanvas, tempCtx, canvas, ctx, size;
let mouseX = 0,
    mouseY = 0;
let width;

const lerp = (value, [min1, max1], [min2, max2]) => {
    // Performs linear interpolation
    // Basically translates maps a value in a larger set of numbers to a value in smaller set of numbers
    return ((value - min1) * (max2 - min2)) / (max1 - min1) + min2;
};

const julia = (z, i = 0) => {
    // Apply the Julia Set formula: z * z + constant
    z = z.mul(z);
    z = z.add(constant);

    // Return if point escaped the Julia Set or if MAX_ITERATIONS has been reached
    if (math.abs(z) > 2 || i === MAX_ITERATIONS) return i;
    return julia(z, i + 1);
};

const resizeCanvas = () => {
    if (window.innerWidth < 1080.98) {
        // Make canvas full-width on mobile
        canvas.height = canvas.width = size = window.innerWidth;
    } else canvas.width = canvas.height = size = window.innerHeight;
    width = window.innerWidth;
    tempCanvas.width = tempCanvas.height = TEMP_SIZE;
};

const pixelToPoint = (x, y) => {
    // Turn XY pixel coordinates into a point on the complex plane
    // Map percentage of total width/height
    let zx = (x / TEMP_SIZE) * 2 - 1;
    let zy = 1 - (y / TEMP_SIZE) * 2;

    return math.complex(zx, zy);
};

const pointToColor = point => {
    // Turn a point on the complex plane into a color
    let iterations = julia(point);
    let percentage = iterations / MAX_ITERATIONS;
    return `rgb(${percentage * 255}, ${percentage}, ${percentage})`;
};

const drawPixel = (x, y, color) => {
    // Draw a single pixel on our temporary canvas
    tempCtx.fillStyle = color;
    tempCtx.fillRect(x, y, 1, 1);
};

const draw = () => {
    // Draw the Julia Set to our temporary canvas
    for (let y = 0; y < TEMP_SIZE; y += 2) {
        for (let x = 0; x < TEMP_SIZE; x += 2) {
            let point = pixelToPoint(x, y);
            let color = pointToColor(point);
            drawPixel(x, y, color);
            drawPixel(x + 1, y + 1, color);
        }
    }
};

const update = () => {
    // Draw to our temporary canvas, then scale to our larger canvas
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, TEMP_SIZE, TEMP_SIZE);
    draw();

    let image = new Image();
    image.src = tempCanvas.toDataURL();
    image.onload = function () {
        // Scale up
        ctx.drawImage(image, 0, 0, TEMP_SIZE, TEMP_SIZE, 0, 0, size, size);
    };
};

window.onload = () => {
    // Determine next meeting with a little bit of logic
    // TODO: Replace with an API (e.g. Google Calendar) as this doesn't take into consideration holidays, etc.
    let differences = {
        0: 1,
        1: 0,
        2: 6,
        3: 5,
        4: 4,
        5: 3,
        6: 2
    };
    let months = {
        1: "January",
        2: "February",
        3: "March",
        4: "April",
        5: "May",
        6: "June",
        9: "September",
        10: "October",
        11: "November",
        12: "December"
    };

    let today = new Date();
    let nextMeeting = new Date(
        today.setDate(today.getDate() + differences[today.getDay()])
    );

    if (months[nextMeeting.getMonth() + 1] !== undefined) {
        document.getElementById("date").innerText = `${
            months[nextMeeting.getMonth() + 1]
        } ${nextMeeting.getDate()}, ${nextMeeting.getFullYear()}`;
    } else {
        document.getElementById("date").innerText =
            "No meetings for the summer!";
    }

    constant = math.complex(...INITIAL_CONSTANT);
    tempCanvas = document.createElement("canvas");
    tempCanvas.width = tempCanvas.height = TEMP_SIZE;
    tempCtx = tempCanvas.getContext("2d");
    canvas = document.querySelector("canvas");
    ctx = canvas.getContext("2d");

    resizeCanvas();
    update(); // Start by updating once

    document.body.addEventListener("pointermove", function (event) {
        // Get the mouse's XY coordinates on page and scale to simulate movement on temporary canvas
        mouseX = event.clientX - document.body.offsetLeft;
        mouseY = event.clientY - document.body.offsetTop;

        mouseX = lerp(mouseX, [0, size], [0, TEMP_SIZE]);
        mouseY = lerp(mouseY, [0, size], [0, TEMP_SIZE]);

        // Turn mouse coordinates into point on the complex plane
        constant = pixelToPoint(mouseX, mouseY);

        // Round that point off to the nearest 0.01
        constant.re = math.round(constant.re * 100) / 100;
        constant.im = math.round(constant.im * 100) / 100;

        update();
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth !== width) {
            resizeCanvas();
            update();
        }
    });
};
