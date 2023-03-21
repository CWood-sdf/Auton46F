//A useful function for getting angleTo
p5.Vector.prototype.angleTo = function (v) {
    var newV = v.copy();
    newV.sub(this);
    return newV.heading();
}
//Adds a program element to the output log
function addListEl(str) {
    $("ul").append(`<li>${str}</li>`);
}
//Removes last element from prog log
function popListEl() {
    $("ul").children().last().remove();
}
//Gets a basic moving button
const basicMoving = () =>
    new MovingButton(
        50, 50, 2, 2, p.color(0, 0, 0), p.color(250, 250, 0), p.color(230, 230, 0), p.color(210, 210, 0),
        "", 0, 0
    );

//Converts field inches measurement to pixels
const inchesToGlobal = v => v / 24 * (field.endX - field.startX) / 6 * height;
//Converts field coordinates to global (height percent)
const toGlobalCoord = (x, y) =>
    p.createVector(
        x * (field.endX - field.startX) / 6 + field.startX,
        y * (field.endY - field.startY) / 6 + field.startY);
//Converts a vector in field coord to global
const toGlobalCoordV = v =>
    p.createVector(
        v.x * (field.endX - field.startX) / 6 + field.startX,
        v.y * (field.endY - field.startY) / 6 + field.startY);
//converts global to field coord
const toFieldCoord = (x, y) => {
    return p.createVector(
        (x / height - field.startX) / field.size * 6,
        (y / height - field.startY) / field.size * 6
    );
};
//Converts global vector to field coord (tiles)
const toFieldCoordV = v => {
    return p.createVector(
        (v.x - field.startX) / field.size * 6,
        (v.y - field.startY) / field.size * 6
    );
};