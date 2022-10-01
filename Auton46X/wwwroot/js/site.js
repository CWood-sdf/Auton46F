p5.Vector.prototype.angleTo = function (v) {
    var newV = v.copy();
    newV.sub(this);
    return newV.heading();
}
function addListEl(str) {
    $("ul").append(`<li>${str}</li>`);
}
function popListEl() {
    $("ul").children().last().remove();
}
const basicMoving = () =>
    new MovingButton(
        50, 50, 2, 2, p.color(0, 0, 0), p.color(250, 250, 0), p.color(230, 230, 0), p.color(210, 210, 0),
        "", 0, 0
    )
;
var width, height, p;
var MOGO_YELLOW, MOGO_RED, MOGO_BLUE, neutralMogos, mogoWidth, redMogos, blueMogos,
    MOGO_BLUE_DARK, MOGO_RED_DARK, rings, RING_PURPLE, GPS_POS, GPS_TOP_LEFT;
const FIELD_TO_NORM = 72.0 / 3.0;
var pathBtnArr = [], allMogos = [], goalBtns = [];

var field = {
    tileWidth: 15,
    startX: 24,
    startY: 4,
    endX: function () { console.log(this); return this.tileWidth * 6 + this.startX; },
    endY: function () { return this.tileWidth * 6 + this.startY },
    size: 0,
};
//Converts field inches measurement to pixels
const inchesToGlobal = v => v / 24 * (field.endX - field.startX) / 6 * height;
const toGlobalCoord = (x, y) =>
    p.createVector(
        x * (field.endX - field.startX) / 6 + field.startX,
        y * (field.endY - field.startY) / 6 + field.startY);
const toGlobalCoordV = v =>
    p.createVector(
        v.x * (field.endX - field.startX) / 6 + field.startX,
        v.y * (field.endY - field.startY) / 6 + field.startY);
const toFieldCoord = (x, y) => {
    return p.createVector(
        (x / height - field.startX) / field.size * 6,
        (y / height - field.startY) / field.size * 6
    );
};
const toFieldCoordV = v => {
    return p.createVector(
        (v.x - field.startX) / field.size * 6,
        (v.y - field.startY) / field.size * 6
    );
};
var stage = 0;
var stages = {
    "init": 0,
    "BotPosition": 1,
    "Programming": 2,
    "Edit driveTo": 3,
    "Edit followPath": 4,
    "Edit turnTo": 5,
    "Edit backwardsFollow": 6,
};
var cmdType = {
    "Mvt": 0,
    "NonMvt": 1
}
const tgc = toGlobalCoord;
var botPos, botAngle;
var buttonAndAction = [];
var pastMvts = [];
var program = [];
var angleToGps;
var allowGoalsMove = true;
var getButtonY = function* (i) {
    yield i;
    for (var x = 1; true; x++) {
        if (i + x * 7 > 90) {
            x = 0;
        }
        yield i + x * 7;
    }
}(5);
var getButtonX = function* (i) {
    yield i;
    for (var x = 1; true; x++) {
        if (i + x * 7 > 90) {
            x = 0;
            i = 43;
        }
        yield i;
    }
}(5);
const compile = () => {
    var ret = `wc.estimateStartPos(PVector(${pastMvts[0][0].x * FIELD_TO_NORM}, ${-pastMvts[0][0].y * FIELD_TO_NORM}), ${pastMvts[0][1]});\n`;
    for (var i of program) {
        ret += "  " + i[1];
        ret += '\n';
    }
    return ret;
};
var initVars = function() {
    field.endX = field.endX();
    field.endY = field.endY();
    field.size = field.endX - field.startX;
    //This all depends on GPS mounting
    //GPS is at [0, 0]
    //The two nums are found by:
    //  x dist to GPS from top left(in) * 1 ft / 12 in * 1 block / 2 ft    (d / 24)
    //  y dist to GPS from top left(in) / 24
    GPS_POS = p.createVector(-0.0 / 24.0, -0.0 / 24.0);
    angleToGps = GPS_POS.heading();
    GPS_TOP_LEFT = p.createVector(-6.5 / 24.0, -6.5 / 24.0);
    GPS_TOP_LEFT.sub(GPS_POS);
    mogoWidth = field.size / 24;
    var xOff = 1.5;
    var w = 35;
    buttonAndAction = [
        [
            new Button(
                bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
                "driveTo(PVector)", xOff, 3),
            function () {
                stage = stages["Edit driveTo"];
            }
        ], // driveTo
        [
            new Button(
                bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
                "followPath(VectorArr)", xOff, 3),
            function () {
                stage = stages["Edit followPath"];
                pathBtnArr = [basicMoving()];
            }
        ], // followPath
        [
            new Button(
                bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
                "backwardsFollow(VectorArr)", xOff, 3),
            function () {
                stage = stages["Edit backwardsFollow"];
                pathBtnArr = [basicMoving()];
            }
        ], // backwardsFollow
        [
            new Button(
                bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
                "turnTo(double)", xOff, 3),
            function () {
                stage = stages["Edit turnTo"];
            }
        ], // turnTo
        [
            new Button(
                bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
                "faceTarget(PVector)", xOff, 3),
            function () {
                stage = stages["Edit faceTarget"];
            }
        ], // faceTarget
        [
            new Button(
                bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
                "spinRoller(void)", xOff, 3),
            function () {
                program.push([
                    cmdType["NonMvt"], `spinRoller();`
                ]);
                addListEl(`spinRoller();`);
            }
        ], // spinRoller
        //[
        //    new Button(
        //        bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
        //        "raiseLiftByOne(void) [threaded]", xOff, 3),
        //    function () {
        //        var c = $("input.Bool").is(":checked");
        //        if (c) {
        //            program.push([
        //                cmdType["NonMvt"], `raiseLiftByOne();`
        //            ]);
        //            addListEl(`raiseLiftByOne();`)
        //        } else {
        //            program.push([
        //                cmdType["NonMvt"], `raiseLiftByOneWait();`
        //            ]);
        //            addListEl(`raiseLiftByOneWait();`);
        //        }

        //    }
        //], // raiseLiftByOne
        //[
        //    new Button(
        //        bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
        //        "lowerLiftByOne(void) [threaded]", xOff, 3),
        //    function () {
        //        var c = $("input.Bool").is(":checked");
        //        if (c) {
        //            program.push([
        //                cmdType["NonMvt"], `lowerLiftByOne();`
        //            ]);
        //            addListEl(`lowerLiftByOne();`);
        //        } else {
        //            program.push([
        //                cmdType["NonMvt"], `lowerLiftByOneWait();`
        //            ]);
        //            addListEl(`lowerLiftByOneWait();`);
        //        }

        //    }
        //], // lowerLiftByOne
        //[
        //    new Button(
        //        bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
        //        "waitForLiftFinish(void)", xOff, 3),
        //    function () {
        //        program.push([
        //            cmdType["NonMvt"], `waitForLiftFinish();`
        //        ]);
        //        addListEl(`waitForLiftFinish();`);
        //    }
        //], // waitForLiftFinish
        //[
        //    new Button(
        //        bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
        //        "clipGoal(void)", xOff, 3),
        //    function () {
        //        program.push([
        //            cmdType["NonMvt"], `clipGoal();`
        //        ]);
        //        addListEl('clipGoal();');
        //    }
        //], // clipGoal
        //[
        //    new Button(
        //        bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
        //        "unclipGoal(void)", xOff, 3),
        //    function () {
        //        program.push([
        //            cmdType["NonMvt"], `unclipGoal();`
        //        ]);
        //        addListEl(`unclipGoal();`);
        //    }
        //], // unclipGoal
        //[
        //    new Button(
        //        bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
        //        "balanceBot(void)", xOff, 3),
        //    function () {
        //        program.push([
        //            cmdType["NonMvt"], `balanceBot();`
        //        ]);
        //        addListEl(`balanceBot();`);

        //    }
        //], // balanceBot
        //[
        //    new Button(
        //        bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
        //        "clipLiftGoal(void)", xOff, 3),
        //    function () {
        //        program.push([
        //            cmdType["NonMvt"], `clipLiftGoal();`
        //        ]);
        //        addListEl(`clipLiftGoal();`);
        //    }
        //], // clipLiftGoal
        //[
        //    new Button(
        //        bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
        //        "unclipLiftGoal(void)", xOff, 3),
        //    function () {
        //        program.push([
        //            cmdType["NonMvt"], `unclipLiftGoal();`
        //        ]);
        //        addListEl(`unclipLiftGoal();`);

        //    }
        //], // unclipLiftGoal
        //[
        //    new Button(
        //        bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
        //        "useLineGoalDetect(void)", xOff, 3),
        //    function () {
        //        program.push([
        //            cmdType["NonMvt"], `useLineGoalDetect();`
        //        ]);
        //        addListEl(`useLineGoalDetect();`);

        //    }
        //], // useLineGoalDetect
        //[
        //    new Button(
        //        bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
        //        "useLineGoalDetectNoExit(void)", xOff, 3),
        //    function () {
        //        program.push([
        //            cmdType["NonMvt"], `useLineGoalDetectNoExit();`
        //        ]);
        //        addListEl(`useLineGoalDetectNoExit();`);

        //    }
        //], // useLineGoalDetectNoExit
    ];
    neutralMogos = [
        toGlobalCoord(3, 1.5),
        toGlobalCoord(3, 3),
        toGlobalCoord(3, 4.5)
    ];
    blueMogos = [
        toGlobalCoord(4.5, 0.5),
        toGlobalCoord(5.5, 4.25)
    ];
    redMogos = [
        toGlobalCoord(1.5, 5.5),
        toGlobalCoord(0.5, 1.75)
    ];


    diskPos = [
        tgc(1.5, 2.5),
        tgc(4.5, 3.5),
        tgc(1.5, 2.5),
        tgc(4.5, 3.5),
        tgc(1.5, 2.5),
        tgc(4.5, 3.5)
    ];
    for (var i = 0; i < 22; i++) {
        diskPos.push(tgc(0 + i / 22 * 6, -0.13));
    }
    for (var v = 0.5; v < 6; v += 0.5) {
        if (v > 2 && v < 4) {
            diskPos.push(tgc(v, v - 1));
            diskPos.push(tgc(v, v + 1));
        }
        if (v === 1.5 || v == 4.5) {
            diskPos.push(tgc(v, v));
            diskPos.push(tgc(v, v));
        }
        //No disks in center
        if (v === 3) { continue; }
        diskPos.push(tgc(v, v));
    }
    for (var v = 1 + 5.5 / 48; v <= 2 - 5.5 / 48; v += (1 - 5.5 / 24) / 2) {
        var n = 6.6 / 48;
        diskPos.push(tgc(v, 4 - n));
        diskPos.push(tgc(v + 3, 2 + n));
        diskPos.push(tgc(2 + n, v + 3));
        diskPos.push(tgc(4 - n, v));
    }
    MOGO_YELLOW = p.color(255, 255, 0);
    MOGO_RED = p.color(255, 0, 0);
    MOGO_BLUE = p.color(0, 0, 255);
    MOGO_RED_DARK = p.color(200, 0, 0);
    MOGO_BLUE_DARK = p.color(0, 0, 200);
    width = p.width / 100;
    height = p.height / 100;
    botPos = p.createVector(0, 0);
    botAngle = 30;
    initVars = () => { };
    for (var i of diskPos) {
        var diskWidth = inchesToGlobal(DISK_WIDTH) / height;
        goalBtns.push(new MovingButton(
            i.x - diskWidth / 2, i.y - diskWidth / 2, diskWidth, diskWidth,
            p.color(0), p.color(0), p.color(0), p.color(0),
            "", 0, 0)
        );
    }
}
var diskPos;
const DISK_WIDTH = 5.5;
function drawBot(pt, r, t) {
    var upperLeftCorner = GPS_TOP_LEFT.copy();
    var botWidth = 13.5 / 24;
    var botHeight = 14 / 24;
    var upperRightCorner = p.createVector(upperLeftCorner.x + botWidth, upperLeftCorner.y);
    var btmLeftCorner = p.createVector(upperLeftCorner.x, upperLeftCorner.y + botHeight);
    var btmRightCorner = p.createVector(upperLeftCorner.x + botWidth, upperLeftCorner.y + botHeight);
    //var innerLeft = p.createVector(upperLeftCorner.x + 3.5 / 24, upperLeftCorner.y + botHeight - 3 / 24);
    //var innerRight = p.createVector(upperLeftCorner.x + botWidth - 3.5 / 24, upperLeftCorner.y + botHeight - 3 / 24);
    //var outerLeft = p.createVector(upperLeftCorner.x + 3.5 / 24, upperLeftCorner.y + botHeight);
    //var outerRight = p.createVector(upperLeftCorner.x + botWidth - 3.5 / 24, upperLeftCorner.y + botHeight);
    var arr = [upperRightCorner, btmRightCorner/*, outerRight, innerRight, innerLeft, outerLeft*/, btmLeftCorner, upperLeftCorner];

    var pos = p5.Vector.add(pt, [3, 3]);
    for (var i of arr) {
        i.rotate(r * p.PI / 180);
        i.add(pos);
    }
    for (var i = 0; i < arr.length; i++) {
        arr[i] = toGlobalCoordV(arr[i]);
    }


    upperLeftCorner = toGlobalCoordV(upperLeftCorner);
    upperRightCorner = toGlobalCoordV(upperRightCorner);
    btmLeftCorner = toGlobalCoordV(btmLeftCorner);
    btmRightCorner = toGlobalCoordV(btmRightCorner);
    p.noFill();
    p.strokeWeight(2);
    p.stroke(0, 255, 0, t);
    p.line(upperLeftCorner.x * height, upperLeftCorner.y * height, upperRightCorner.x * height, upperRightCorner.y * height);
    p.stroke(255, 255, 255, t);
    p.beginShape();
    for (var i of arr) {
        p.vertex(i.x * height, i.y * height);
    }
    p.endShape();
}
function drawField() {

    p.background(100);
    p.stroke(255);
    p.strokeWeight(1);
    //Field Lines
    {
        //Basic Field Lines
        for (var i = 0; i < 7; i++) {
            var base = height * field.startX + height * i * field.tileWidth;
            p.line(base, height * field.startY, base, height * field.endY);
        }
        for (var i = 0; i < 7; i++) {
            var base = height * field.startY + height * i * field.tileWidth;
            p.line(height * field.startX, base, height * field.endX, base);
        }
        p.strokeWeight(3);
        
        var autonLines = [
            [toGlobalCoord(0, 1), toGlobalCoord(0.5, 1)],
            [toGlobalCoord(6, 5), toGlobalCoord(5.5, 5)],
            [toGlobalCoord(2, 0), toGlobalCoord(2, 0.5)],
            [toGlobalCoord(4, 6), toGlobalCoord(4, 5.5)],
            [toGlobalCoord(0, 4), toGlobalCoord(1, 4)],
            [toGlobalCoord(6, 2), toGlobalCoord(5, 2)],
            [toGlobalCoord(2, 6), toGlobalCoord(2, 5)],
            [toGlobalCoord(4, 0), toGlobalCoord(4, 1)],
            [toGlobalCoord(0.05, 0), toGlobalCoord(6, 5.95)],
            [toGlobalCoord(0, 0.05), toGlobalCoord(5.95, 6)]
        ];
        for (var i of autonLines) {
            p.line(i[0].x * height, i[0].y * height, i[1].x * height, i[1].y * height);
        }
        
    }
    var vertex = (x, y) => {
        var pt = toGlobalCoord(x, y);
        p.vertex(pt.x * height, pt.y * height);
    };
    var quadVertex = (x, y, cx, cy) => {
        var pt = toGlobalCoord(x, y);
        var pt2 = toGlobalCoord(cx, cy);
        p.quadraticVertex(pt.x * height, pt.y * height, pt2.x * height, pt2.y * height);
    }
    //Barriers
    {
        p.noFill();
        p.stroke(MOGO_RED);
        p.strokeWeight(8);
        p.beginShape();
        vertex(1, 4);
        vertex(2, 4);
        vertex(2, 5);
        p.endShape();

        p.noFill();
        p.stroke(MOGO_BLUE);
        p.strokeWeight(8);
        p.beginShape();
        vertex(5, 2);
        vertex(4, 2);
        vertex(4, 1);
        p.endShape();
    }

    //High Goals
    {

        var width = inchesToGlobal(15);
        p.fill(p.red(MOGO_RED), p.green(MOGO_RED), p.blue(MOGO_RED), 150);
        p.stroke(MOGO_RED);
        p.strokeWeight(5);
        var pos = toGlobalCoord(6 - 0.92, 0.92);
        p.ellipse(pos.x * height, pos.y * height, width);
        p.fill(p.red(MOGO_BLUE), p.green(MOGO_BLUE), p.blue(MOGO_BLUE), 150);
        p.stroke(MOGO_BLUE);
        p.strokeWeight(5);
        var pos = toGlobalCoord(0.92, 6 - 0.92);
        p.ellipse(pos.x * height, pos.y * height, width);
    }

    //Loaders
    {
        var posLeft = toGlobalCoord(0, 3);
        p.noStroke();
        p.fill(180, 180, 180);
        p.beginShape();
        p.vertex(posLeft.x * height, (posLeft.y + 2) * height);
        p.vertex((posLeft.x - 3) * height, (posLeft.y + 3) * height);
        p.vertex((posLeft.x - 3) * height, (posLeft.y - 3) * height);
        p.vertex(posLeft.x * height, (posLeft.y - 2) * height);
        p.vertex(posLeft.x * height, (posLeft.y + 2) * height);
        p.endShape(p.CLOSE);

        var posRight = toGlobalCoord(6, 3);
        p.noStroke();
        p.fill(180, 180, 180);
        p.beginShape();
        p.vertex(posRight.x * height, (posRight.y + 2) * height);
        p.vertex((posRight.x + 3) * height, (posRight.y + 3) * height);
        p.vertex((posRight.x + 3) * height, (posRight.y - 3) * height);
        p.vertex(posRight.x * height, (posRight.y - 2) * height);
        p.vertex(posRight.x * height, (posRight.y + 2) * height);
        p.endShape(p.CLOSE);

    }

    //Disks
    {
        if (allowGoalsMove) {
            for (var btn of goalBtns) {
                btn.handlePress();
                if (btn.pressing) {
                    break;
                }
            }
        }
        for (var btn of goalBtns) {
            btn.isDone();
        }
        if (stage === stages["Programming"]) {
            for (var i = 0; i < goalBtns.length; i++) {
                diskPos[i] = goalBtns[i].position();
            }
        }
        var diskWidth = inchesToGlobal(DISK_WIDTH);
        var col = MOGO_YELLOW;
        p.stroke(0);
        p.strokeWeight(1);
        p.fill(col);
        for (var pos of diskPos) {
            p.ellipse(pos.x * height, pos.y * height, diskWidth);
        }
    }

    //Rollers
    {
        p.noStroke();
        var blackWidth = inchesToGlobal(1.675);
        var rollerWidth = inchesToGlobal(9.8);
        var rollerHeight = inchesToGlobal(2.4) / 2;
        //Top left
        var pos = tgc(0, 1);
        p.fill(MOGO_BLUE);
        p.rect(pos.x * height, pos.y * height + blackWidth, rollerHeight, rollerWidth);
        p.fill(MOGO_RED);
        p.rect(pos.x * height + rollerHeight, pos.y * height + blackWidth, rollerHeight, rollerWidth);
        p.fill(0);
        p.rect(pos.x * height, pos.y * height, rollerHeight * 2, blackWidth);
        p.rect(pos.x * height, pos.y * height + rollerWidth + blackWidth, rollerHeight * 2, blackWidth);
        //Top right
        pos = tgc(1, 0);
        p.fill(MOGO_BLUE);
        p.rect(pos.x * height + blackWidth, pos.y * height + rollerHeight, rollerWidth, rollerHeight);
        p.fill(MOGO_RED);
        p.rect(pos.x * height + blackWidth, pos.y * height, rollerWidth, rollerHeight);
        p.fill(0);
        p.rect(pos.x * height, pos.y * height, blackWidth, rollerHeight * 2);
        p.rect(pos.x * height + rollerWidth + blackWidth, pos.y * height, blackWidth, rollerHeight * 2);
        //Btm right
        var pos = tgc(6, 5);
        p.fill(MOGO_BLUE);
        p.rect(pos.x * height - rollerHeight * 2, pos.y * height - blackWidth - rollerWidth, rollerHeight, rollerWidth);
        p.fill(MOGO_RED);
        p.rect(pos.x * height - rollerHeight, pos.y * height - blackWidth - rollerWidth, rollerHeight, rollerWidth);
        p.fill(0);
        p.rect(pos.x * height - rollerHeight * 2, pos.y * height - blackWidth * 2 - rollerWidth, rollerHeight * 2, blackWidth);
        p.rect(pos.x * height - rollerHeight * 2, pos.y * height - blackWidth, rollerHeight * 2, blackWidth);
        //Btm left
        pos = tgc(5, 6);
        p.fill(MOGO_BLUE);
        p.rect(pos.x * height - blackWidth - rollerWidth, pos.y * height - rollerHeight, rollerWidth, rollerHeight);
        p.fill(MOGO_RED);
        p.rect(pos.x * height - blackWidth - rollerWidth, pos.y * height - 2 * rollerHeight, rollerWidth, rollerHeight);
        p.fill(0);
        p.rect(pos.x * height - blackWidth, pos.y * height - rollerHeight * 2, blackWidth, rollerHeight * 2);
        p.rect(pos.x * height - rollerWidth - 2 * blackWidth, pos.y * height - rollerHeight * 2, blackWidth, rollerHeight * 2);
    }
    
    //Robot
    {
        drawBot(botPos, botAngle, 255);
    }
}
function mobileGoal(x, y) {
    p.strokeWeight(0);
    var w = p.createVector(0, mogoWidth * height);
    p.beginShape();
    var rot = p.TWO_PI / 7;
    for (var i = 0; i < 7; i++) {
        p.vertex(w.x + x*height, w.y + y*height);
        w.rotate(rot);
    }
    p.endShape(p.CLOSE);
}
function fakeBot(pt, r) {
    drawBot(pt, r, 150);
}
var bankOff = 120;

function programmingBank() {
    p.fill(60);
    p.noStroke();
    p.rect(bankOff * height, 0 * height, p.width - bankOff * height, 100 * height);
    p.fill(255);
    p.textSize(1.8 * height);
    for (var i of buttonAndAction) {
        i[0].handlePress();
        i[0].draw();
        if (i[0].isDone()) {
            i[1]();
        }
    }
}
function limDecimal(num) {
    var str = `${num}`;
    var ret = '';
    var count = 0;
    var willCount = false;
    for (var i of str) {
        ret += i;
        if (willCount) {
            count++;
            if (count >= 2) {
                break;
            }
        }
        if (i == '.') {
            willCount = true;
        }
        
    }
    return ret;
}
const s = pi => {
    p = pi;

    pi.setup = function () {
        pi.createCanvas(window.innerWidth, window.innerHeight);
    };
    stage = stages["init"];
    var angleSlide = new Slide(10, 96, 50, 2, 360, p.color(0, 0, 0), p.color(255, 0, 0), p.color(255, 255, 0));
    var toNextBtn = new Button(
        120, 90, 16, 8, p.color(0, 0, 0), p.color(0, 255, 0), p.color(0, 230, 0), p.color(0, 200, 0),
        "Next", 2.5, 5.5);
    var undoBtn = new Button(
        5, 90, 17, 5.5, p.color(0), p.color(200), p.color(180), p.color(160),
        "Undo", 2.5, 3.5
    );
    var compileBtn = new Button(
        5, 80, 17, 5.5, p.color(0), p.color(200), p.color(180), p.color(160),
        "Compile", 2.5, 3.5
    );
    var editDriveToPos = basicMoving();
    var addBtn = new Button(
        60, 95, 4, 4, p.color(0, 0, 0), p.color(200), p.color(180), p.color(160),
        "+", 0.9, 3.0
    );
    var commitBtn = new Button(
        120, 90, 18, 8, p.color(0, 0, 0), p.color(0, 255, 0), p.color(0, 230, 0), p.color(0, 200, 0),
        "Commit", 2.5, 5.5
    );
    var deleteBtn = new Button(
        5, 90, 17, 8, p.color(0, 0, 0), p.color(255, 0, 0), p.color(230, 0, 0), p.color(200, 0, 0),
        "Delete", 2.5, 5.5
    );
    var algorithmChange = new Button(
        120, 70, 17, 8, p.color(0, 0, 0), p.color(0, 0, 255), p.color(0, 0, 230), p.color(0, 0, 200),
        "", 2.5, 5.5);
    var turnToAngle = basicMoving();
    var driveAlgorithm = 0;
    var algorithms = ["Pure Pursuit", "Ramsete", "Basic PID"];
    var algToVar = {
        "Pure Pursuit": "&purePursuit",
        "Ramsete": "&ramsete",
        "Basic PID": "&pidController"
    };
    pi.draw = function () {
        if (stage !== 0) {
            drawField();
        }
        switch (stage) {
            case stages["init"]:
                $("input").hide();
                initVars();
                stage = stages["BotPosition"];
                break;
            case stages["BotPosition"]:
                allowGoalsMove = false;
                p.fill(255);
                p.textFont("Comic Sans MS");
                p.textSize(3 * height);
                p.text("Position the robot", 1 * height, 50, (field.startX - 2) * height, 300);
                angleSlide.adjust();
                angleSlide.draw();
                botAngle = angleSlide.getVal();
                p.textSize(2.5 * height);
                p.fill(255, 255, 255);
                p.text(`Bot Angle: ${botAngle}`, (angleSlide.x + angleSlide.w + 5) * height, (angleSlide.y + angleSlide.h) * height);
                toNextBtn.handlePress();
                p.textSize(2.5 * height);
                toNextBtn.draw();
                if (toNextBtn.isDone()) {
                    $("ul").append(`<li>[${limDecimal(botPos.x)}, ${limDecimal(botPos.y)}], ${limDecimal(botAngle)}</li>`);
                    allowGoalsMove = true;
                    $(".ProgInput").show();

                    pastMvts.push([botPos, botAngle]);
                    stage = stages["Programming"];
                }
                break;
            case stages["Programming"]:
                p.fill(255);
                p.textFont("Comic Sans MS");
                p.textSize(3 * height);
                p.text("Program the robot", 1 * height, 50, (field.startX - 2) * height, 300);
                undoBtn.handlePress();
                undoBtn.draw(); 
                compileBtn.handlePress();
                compileBtn.draw();
                if (compileBtn.isDone()) {
                    var prog = compile(); 
                    console.log(prog);
                    window.navigator.clipboard.writeText(prog);
                    window.alert("Program Copied!");
                }
                if (undoBtn.isDone() && program.length !== 0) {
                    var last = program[program.length - 1];
                    if (last[0] == cmdType["Mvt"]) {
                        var cllctn = pastMvts[pastMvts.length - 1];
                        botPos = cllctn[0];
                        botAngle = cllctn[1];
                        pastMvts.pop();
                    }
                    popListEl();
                    program.pop();
                }
                programmingBank();
                break;
            case stages["Edit driveTo"]:
                editDriveToPos.handlePress();
                allowGoalsMove = true;
                if (editDriveToPos.pressing) {
                    allowGoalsMove = false;
                }
                editDriveToPos.isDone();
                var fieldPos = toFieldCoordV(editDriveToPos.position());
                fieldPos.sub(3, 3);
                var angle = botPos.angleTo(fieldPos) * 360 / p.TWO_PI + 90;
                var path = bezierCurve(new VectorArr([botPos, fieldPos]), 0.05);
                for (var i of path) {
                    var pt = toGlobalCoordV(p5.Vector.add(i, p.createVector(3, 3)));
                    p.stroke(255, 255, 0);
                    p.strokeWeight(3);
                    p.point(pt.x * height, pt.y * height);
                }

                fakeBot(fieldPos, angle);
                p.textSize(2.5 * height);
                editDriveToPos.draw();
                deleteBtn.draw();
                deleteBtn.handlePress();
                commitBtn.draw();
                commitBtn.handlePress();
                if (deleteBtn.isDone()) {
                    stage = stages["Programming"];
                }
                else if (commitBtn.isDone()) {
                    pastMvts.push([botPos, botAngle]);
                    stage = stages["Programming"];
                    program.push([
                        cmdType["Mvt"],
                        `wc.driveTo(${limDecimal(fieldPos.x * FIELD_TO_NORM)}, ${-limDecimal(fieldPos.y * FIELD_TO_NORM)});`
                    ]);
                    addListEl(`wc.driveTo(${limDecimal(fieldPos.x * FIELD_TO_NORM)}, ${-limDecimal(fieldPos.y * FIELD_TO_NORM)});`);
                    botPos = fieldPos;
                    botAngle = angle;
                }
                break;
            case stages["Edit followPath"]:
                //var handleOtherPress = true;
                allowGoalsMove = true;
                for (var i of pathBtnArr) {
                    i.handlePress();
                    
                    if (i.pressing) {
                        allowGoalsMove = false;
                        break;
                    }
                }
                algorithmChange.handlePress();
                if (algorithmChange.isDone()) {
                    var msg = algorithms[driveAlgorithm++];
                    if (msg === undefined) {
                        driveAlgorithm = 0;
                        msg = algorithms[driveAlgorithm++];
                    }
                    algorithmChange.msg = msg;
                }
                algorithmChange.draw();
                
                for (var i of pathBtnArr) {
                    i.isDone();
                } 

                var pos = new VectorArr([botPos]);
                for (var i of pathBtnArr) {
                    var fieldPos = toFieldCoordV(i.position());
                    fieldPos.sub(3, 3);
                    pos.push(fieldPos);
                }
                var angle = pos.arr[pos.size() - 2].angleTo(pos.last()) * 360 / p.TWO_PI + 90;
                var path = bezierCurve(pos, 0.05);
                for (var i of path) {
                    var pt = toGlobalCoordV(p5.Vector.add(i, p.createVector(3, 3)));
                    p.stroke(255, 255, 0);
                    p.strokeWeight(3);
                    p.point(pt.x * height, pt.y * height);
                }

                fakeBot(pos.last(), angle);
                for (var i of pathBtnArr) {
                    i.draw();
                }
                p.textSize(2.5 * height);
                //editDriveToPos.draw();
                addBtn.draw();
                addBtn.handlePress();
                deleteBtn.draw();
                deleteBtn.handlePress();
                commitBtn.draw();
                commitBtn.handlePress();
                if (deleteBtn.isDone()) {
                    stage = stages["Programming"];
                }
                else if (commitBtn.isDone()) {
                    pastMvts.push([botPos, botAngle]);
                    stage = stages["Programming"];
                    pos.arr.shift();
                    var str = '';//`PVector(${limDecimal(botPos.x * FIELD_TO_NORM)}, ${limDecimal(botPos.y * FIELD_TO_NORM)})`;
                    for (var i of pos) {
                        str += `PVector(${limDecimal(i.x * FIELD_TO_NORM)}, ${-limDecimal(i.y * FIELD_TO_NORM)}), `;
                    }
                    str = str.substring(0, str.length - 2);
                    
                    program.push([
                        cmdType["Mvt"],
                        `wc.followPath(${algToVar[algorithmChange.msg || "Pure Pursuit"]}, {${str}});`
                    ]);
                    addListEl(`wc.followPath(${algToVar[algorithmChange.msg || "Pure Pursuit"]}, {${str}});`);
                    botPos = fieldPos;
                    botAngle = angle;
                }
                if (addBtn.isDone()) {
                    pathBtnArr.push(basicMoving());
                }
                break;
            case stages["Edit backwardsFollow"]:
                //var handleOtherPress = true;
                allowGoalsMove = true;
                for (var i of pathBtnArr) {
                    i.handlePress();

                    if (i.pressing) {
                        allowGoalsMove = false;
                        break;
                    }
                }
                for (var i of pathBtnArr) {
                    i.isDone();
                }

                algorithmChange.handlePress();
                if (algorithmChange.isDone()) {
                    var msg = algorithms[driveAlgorithm++];
                    if (msg === undefined) {
                        driveAlgorithm = 0;
                        msg = algorithms[driveAlgorithm++];
                    }
                    algorithmChange.msg = msg;
                }
                algorithmChange.draw();
                var pos = new VectorArr([botPos]);
                for (var i of pathBtnArr) {
                    var fieldPos = toFieldCoordV(i.position());
                    fieldPos.sub(3, 3);
                    pos.push(fieldPos);
                }
                var angle = pos.arr[pos.size() - 2].angleTo(pos.last()) * 360 / p.TWO_PI - 90;
                var path = bezierCurve(pos, 0.05);
                for (var i of path) {
                    var pt = toGlobalCoordV(p5.Vector.add(i, p.createVector(3, 3)));
                    p.stroke(255, 255, 0);
                    p.strokeWeight(3);
                    p.point(pt.x * height, pt.y * height);
                }

                fakeBot(pos.last(), angle);
                for (var i of pathBtnArr) {
                    i.draw();
                }
                p.textSize(2.5 * height);
                //editDriveToPos.draw();
                addBtn.draw();
                addBtn.handlePress();
                deleteBtn.draw();
                deleteBtn.handlePress();
                commitBtn.draw();
                commitBtn.handlePress();
                if (deleteBtn.isDone()) {
                    stage = stages["Programming"];
                }
                else if (commitBtn.isDone()) {
                    pastMvts.push([botPos, botAngle]);
                    stage = stages["Programming"];
                    pos.arr.shift();
                    var str = '';//`PVector(${limDecimal(botPos.x * FIELD_TO_NORM)}, ${limDecimal(botPos.y * FIELD_TO_NORM)})`;
                    for (var i of pos) {
                        str += `PVector(${limDecimal(i.x * FIELD_TO_NORM)}, ${-limDecimal(i.y * FIELD_TO_NORM)}), `;
                    }
                    str = str.substring(0, str.length - 2);
                    program.push([
                        cmdType["Mvt"],
                        `wc.backwardsFollow(${algToVar[algorithmChange.msg ?? "Pure Pursuit"]}, {${str}});`
                    ]);
                    addListEl(`wc.backwardsFollow(${algToVar[algorithmChange.msg ?? "Pure Pursuit"]}, {${str}});`);
                    botPos = fieldPos;
                    botAngle = angle;
                }
                if (addBtn.isDone()) {
                    pathBtnArr.push(basicMoving());
                }
                break;
            case stages["Edit turnTo"]:
                turnToAngle.handlePress();
                allowGoalsMove = true;
                if (turnToAngle.pressing) {
                    allowGoalsMove = false;
                }
                turnToAngle.isDone();
                var fieldPos = toFieldCoordV(turnToAngle.position());
                fieldPos.sub(3, 3);
                
                p.stroke(255, 255, 0, 200);
                p.strokeWeight(1);
                var botCenter = GPS_POS.copy();
                botCenter.mult(-1);
                botCenter.rotate(botAngle * p.PI / 180.0);
                botCenter.add(botPos);
                
                var fieldCoord = toGlobalCoordV(p5.Vector.add(fieldPos, p.createVector(3, 3)));
                var botCoord = toGlobalCoordV(p5.Vector.add(botCenter, p.createVector(3, 3)));
                var newGps = GPS_POS.copy();
                var angle = botCenter.angleTo(fieldPos) * 360 / p.TWO_PI + 90;
                newGps.rotate(angle * p.PI / 180.0);
                botCenter.add(newGps);
                p.line(fieldCoord.x * height, fieldCoord.y * height, botCoord.x * height, botCoord.y * height);
                fakeBot(botCenter, angle);
                p.textSize(2.5 * height);
                turnToAngle.draw();
                deleteBtn.draw();
                deleteBtn.handlePress();
                commitBtn.draw();
                commitBtn.handlePress();
                if (deleteBtn.isDone()) {
                    stage = stages["Programming"];
                }
                else if (commitBtn.isDone()) {
                    pastMvts.push([botPos, botAngle]);
                    stage = stages["Programming"];
                    program.push([
                        cmdType["Mvt"],
                        `wc.turnTo(${limDecimal(angle)});`
                    ]);
                    addListEl(`wc.turnTo(${limDecimal(angle)});`);
                    botAngle = angle;
                    botPos = botCenter;
                }
                break;
            case stages["Edit faceTarget"]:
                turnToAngle.handlePress();
                allowGoalsMove = true;
                if (turnToAngle.pressing) {
                    allowGoalsMove = false;
                }
                turnToAngle.isDone();
                var fieldPos = toFieldCoordV(turnToAngle.position());
                fieldPos.sub(3, 3);
                
                p.stroke(255, 255, 0, 200);
                p.strokeWeight(1);
                var botCenter = GPS_POS.copy();
                botCenter.mult(-1);
                botCenter.rotate(botAngle * p.PI / 180.0);
                botCenter.add(botPos);
                
                var fieldCoord = toGlobalCoordV(p5.Vector.add(fieldPos, p.createVector(3, 3)));
                var botCoord = toGlobalCoordV(p5.Vector.add(botCenter, p.createVector(3, 3)));
                var newGps = GPS_POS.copy();
                var angle = botCenter.angleTo(fieldPos) * 360 / p.TWO_PI + 90;
                newGps.rotate(angle * p.PI / 180.0);
                botCenter.add(newGps);
                p.line(fieldCoord.x * height, fieldCoord.y * height, botCoord.x * height, botCoord.y * height);
                fakeBot(botCenter, angle);
                p.textSize(2.5 * height);
                turnToAngle.draw();
                deleteBtn.draw();
                deleteBtn.handlePress();
                commitBtn.draw();
                commitBtn.handlePress();
                if (deleteBtn.isDone()) {
                    stage = stages["Programming"];
                }
                else if (commitBtn.isDone()) {
                    pastMvts.push([botPos, botAngle]);
                    stage = stages["Programming"];
                    program.push([
                        cmdType["Mvt"],
                        `wc.faceTarget({${limDecimal(fieldPos.x * FIELD_TO_NORM)}, ${limDecimal(fieldPos.y * -FIELD_TO_NORM)}});`
                    ]);
                    addListEl(`wc.faceTarget({${limDecimal(fieldPos.x * FIELD_TO_NORM)}, ${limDecimal(fieldPos.y * -FIELD_TO_NORM)}});`);
                    botAngle = angle;
                    botPos = botCenter;
                }
                break;
        }


    };
    pi.mouseDragged = function () {
        switch (stage) {
            case 1:
                var old = botPos.copy();
                botPos = toFieldCoord(p.mouseX, p.mouseY);
                botPos.x -= 3;
                botPos.y -= 3;
                if (Math.abs(botPos.x) > 3 || Math.abs(botPos.y) > 3) {
                    botPos = old;
                }
                console.log(botPos);
                break;

        }
    }
};

