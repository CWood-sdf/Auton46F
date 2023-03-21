class MovingButton {
    constraintPoints = [];
    constructor(x, y, w, h, border, inner, hover, press, msg, tOffX, tOffY) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.border = border;
        this.inner = inner;
        this.press = press;
        this.pressing = false;
        this.msg = msg;
        this.pressed = false;
        this.hover = hover;
        this.offX = tOffX;
        this.offY = tOffY;
        this.hovering = true;
    };
    setConstraints(arr){
        this.constraintPoints = arr;
        while (this.constraintPoints.length > 2) {
            this.constraintPoints.pop();
        }
    }
    draw() {
        p.stroke(this.border);
        p.strokeWeight(1);
        p.fill(this.inner);
        if (this.hovering) {
            p.fill(this.hover);
        }
        if (this.pressing) {
            p.fill(this.press);
        }
        if (this.constraintPoints.length >= 2) {
            p.line(this.constraintPoints[0].x * height, this.constraintPoints[0].y * height, (this.x + this.w / 2) * height, (this.y + this.h / 2) * height);
        }
        p.rect((this.x) * height, (this.y) * height, this.w * height, this.h * height, 10);
        p.fill(255, 255, 255);
        p.text(this.msg, (this.x + this.offX) * height, (this.y + this.offY) * height);
    };
    handlePress() {
        if (p.mouseX > this.x * height && p.mouseY > this.y * height && p.mouseX < (this.x + this.w) * height && p.mouseY < (this.y + this.h) * height) {
            this.hovering = true;
        }
        else {
            this.hovering = false;
        }
        if (this.pressing && p.mouseIsPressed && !(p.mouseX > this.x * height && p.mouseY > this.y * height && p.mouseX < (this.x + this.w) * height && p.mouseY < (this.y + this.h) * height)) {
            this.x = p.mouseX / height - this.w / 2;
            this.y = p.mouseY / height - this.h / 2;
        }
        if (p.mouseIsPressed && p.mouseX > this.x * height && p.mouseY > this.y * height && p.mouseX < (this.x + this.w) * height && p.mouseY < (this.y + this.h) * height) {
            this.x = p.mouseX / height - this.w / 2;
            this.y = p.mouseY / height - this.h / 2;
            if (this.constraintPoints.length > 0) {
                // debugger;
                //The 2 constraint points define a line segment that the button must stay on
                var p1 = this.constraintPoints[0];
                var p2 = this.constraintPoints[1];
                var p3 = p.createVector(this.x, this.y);

                var v1 = p5.Vector.sub(p2, p1);
                var v2 = p5.Vector.sub(p3, p1);

                var dot = v1.dot(v2);
                var v1mag = v1.mag();

                var v1norm = v1.copy();
                // v1norm.normalize();

                var v1normScaled = v1norm.copy();
                v1normScaled.mult(dot / (v1mag * v1mag));

                var closestPoint = p5.Vector.add(p1, v1normScaled);

                var dist = p5.Vector.dist(p3, closestPoint);

                if (dist > 0.1) {
                    this.x = closestPoint.x - this.w / 2;
                    this.y = closestPoint.y - this.w / 2;
                }
                p3 = p.createVector(this.x + this.w, this.y);
                //If p3 is outside the constraint line segment, move it back
                if (p3.dist(p1) > p1.dist(p2)) {
                    this.x = p2.x - this.w / 2;
                    this.y = p2.y - this.h / 2;
                }
                if(p3.dist(p2) > p1.dist(p2)) {
                    this.x = p1.x - this.w / 2;
                    this.y = p1.y - this.h / 2;
                }
            }
            this.pressing = true;
            this.hovering = false;
        }
        else if (p.mouseIsPressed) {
            //this.pressing = false;
        }
        else if (!p.mouseIsPressed && this.pressing) {
            this.pressed = true;
            this.pressing = false;
        }
    };
    released() {
        if(!this.pressing && this.pressed) {
            return true;
        }
        return false;
    };
    position() {
        return p.createVector(this.x + this.w / 2, this.y + this.h / 2);
    };
    isDone() {
        if (this.pressed) {
            this.pressing = false;
            this.pressed = false;
            return true;
        }
        return false;
    };
};