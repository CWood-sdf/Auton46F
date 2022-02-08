class Slide {
    constructor(x, y, w, h, inc, border, inner, button) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.inc = inc;
        this.border = border;
        this.inner = inner;
        this.button = button;
        this.xPos = this.x;
    }
    draw() {
        p.stroke(this.border);
        p.strokeWeight(3);
        p.fill(this.inner);
        p.rect(this.x * height - 2, this.y * height, this.w * height + 4, this.h * height, 10);
        p.noStroke();
        p.fill(this.button);
        p.ellipse(this.xPos * height, this.y * height + this.h * height / 2, this.h * height, this.h * height);
    }
    adjust() {
        if (p.mouseIsPressed && p.mouseX > this.x * height && p.mouseY > this.y * height && p.mouseX < (this.x + this.w) * height && p.mouseY < (this.y + this.h) * height) {
            this.xPos = p.mouseX / height;
        }
    }
    getVal() {
        return (this.xPos - this.x) / this.w * this.inc;
    }
};