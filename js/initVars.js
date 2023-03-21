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
var initVars = function () {
    field.endX = field.endX();
    field.endY = field.endY();
    field.size = field.endX - field.startX;
    //This all depends on GPS mounting
    //GPS is at [0, 0]
    //The two nums are found by:
    //  x dist to GPS from top left(in) * 1 ft / 12 in * 1 block / 2 ft    (d / 24)
    //  y dist to GPS from top left(in) / 24
    POS = p.createVector(-0.0 / 24.0, -0.0 / 24.0);
    POS_TOP_LEFT = p.createVector(-botWidth / 2 / 24.0, -botHeight / 2 / 24.0);
    POS_TOP_LEFT.sub(POS);
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
                "backInto(PVector)", xOff, 3),
            function () {
                stage = stages["Edit backInto"];
            }
        ], // backInto
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
        [
            new Button(
                bankOff + getButtonX.next().value, getButtonY.next().value, w, 5, p.color(0), p.color(100), p.color(80), p.color(60),
                "launchDisks(void)", xOff, 3),
            function () {
                program.push([
                    cmdType["NonMvt"], `launchDisks();`
                ]);
                addListEl(`launchDisks();`);
            }
        ], // launchDisks
    ];


    diskPos = [
        toGlobalCoord(1.5, 2.5),
        toGlobalCoord(4.5, 3.5),
        toGlobalCoord(1.5, 2.5),
        toGlobalCoord(4.5, 3.5),
        toGlobalCoord(1.5, 2.5),
        toGlobalCoord(4.5, 3.5)
    ];
    for (var i = 0; i < 22; i++) {
        diskPos.push(toGlobalCoord(0 + i / 21 * 6, -0.13));
    }
    for (var v = 0.5; v < 6; v += 0.5) {
        if (v > 2 && v < 4) {
            diskPos.push(toGlobalCoord(v, v - 1));
            diskPos.push(toGlobalCoord(v, v + 1));
        }
        if (v === 1.5 || v == 4.5) {
            diskPos.push(toGlobalCoord(v, v));
            diskPos.push(toGlobalCoord(v, v));
        }
        //No disks in center
        if (v === 3) { continue; }
        diskPos.push(toGlobalCoord(v, v));
    }
    for (var v = 1 + 5.5 / 48; v <= 2 - 5.5 / 48; v += (1 - 5.5 / 24) / 2) {
        var n = 6.6 / 48;
        diskPos.push(toGlobalCoord(v, 4 - n));
        diskPos.push(toGlobalCoord(v + 3, 2 + n));
        diskPos.push(toGlobalCoord(2 + n, v + 3));
        diskPos.push(toGlobalCoord(4 - n, v));
    }
    YELLOW = p.color(255, 255, 0);
    RED = p.color(255, 0, 0);
    BLUE = p.color(0, 0, 255);
    RED_DARK = p.color(200, 0, 0);
    BLUE_DARK = p.color(0, 0, 200);
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
};