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
        //Game dependent
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
    //org used for tipping point platform bc the black tubes had curves
    var quadVertex = (x, y, cx, cy) => {
        var pt = toGlobalCoord(x, y);
        var pt2 = toGlobalCoord(cx, cy);
        p.quadraticVertex(pt.x * height, pt.y * height, pt2.x * height, pt2.y * height);
    }
    //Barriers (not bad)
    {
        p.noFill();
        p.stroke(RED);
        p.strokeWeight(8);
        p.beginShape();
        vertex(1, 4);
        vertex(2, 4);
        vertex(2, 5);
        p.endShape();

        p.noFill();
        p.stroke(BLUE);
        p.strokeWeight(8);
        p.beginShape();
        vertex(5, 2);
        vertex(4, 2);
        vertex(4, 1);
        p.endShape();
    }

    //High Goals (maybe u can look)
    {

        var width = inchesToGlobal(15);
        p.fill(p.red(RED), p.green(RED), p.blue(RED), 150);
        p.stroke(RED);
        p.strokeWeight(5);
        var pos = toGlobalCoord(6 - 0.92, 0.92);
        p.ellipse(pos.x * height, pos.y * height, width);
        p.fill(p.red(BLUE), p.green(BLUE), p.blue(BLUE), 150);
        p.stroke(BLUE);
        p.strokeWeight(5);
        var pos = toGlobalCoord(0.92, 6 - 0.92);
        p.ellipse(pos.x * height, pos.y * height, width);
    }

    //Loaders (also dont look)
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
        if (allowObjectsMove) {
            for (var btn of goalBtns) {
                btn.handlePress();
                if (btn.pressing) {
                    break;
                }
            }
            for (var btn of goalBtns) {
                btn.isDone();
            }
        }
        if (stage === stages["Programming"]) {
            for (var i = 0; i < goalBtns.length; i++) {
                diskPos[i] = goalBtns[i].position();
            }
        }
        var diskWidth = inchesToGlobal(DISK_WIDTH);
        var col = YELLOW;
        p.stroke(0);
        p.strokeWeight(1);
        p.fill(col);
        for (var pos of diskPos) {
            p.ellipse(pos.x * height, pos.y * height, diskWidth);
        }
    }

    //Rollers (don't look at this code)
    {
        p.noStroke();
        var blackWidth = inchesToGlobal(1.675);
        var rollerWidth = inchesToGlobal(9.8);
        var rollerHeight = inchesToGlobal(2.4) / 2;
        //Top left
        var pos = toGlobalCoord(0, 1);
        p.fill(BLUE);
        p.rect(pos.x * height, pos.y * height + blackWidth, rollerHeight, rollerWidth);
        p.fill(RED);
        p.rect(pos.x * height + rollerHeight, pos.y * height + blackWidth, rollerHeight, rollerWidth);
        p.fill(0);
        p.rect(pos.x * height, pos.y * height, rollerHeight * 2, blackWidth);
        p.rect(pos.x * height, pos.y * height + rollerWidth + blackWidth, rollerHeight * 2, blackWidth);
        //Top right
        pos = toGlobalCoord(1, 0);
        p.fill(BLUE);
        p.rect(pos.x * height + blackWidth, pos.y * height + rollerHeight, rollerWidth, rollerHeight);
        p.fill(RED);
        p.rect(pos.x * height + blackWidth, pos.y * height, rollerWidth, rollerHeight);
        p.fill(0);
        p.rect(pos.x * height, pos.y * height, blackWidth, rollerHeight * 2);
        p.rect(pos.x * height + rollerWidth + blackWidth, pos.y * height, blackWidth, rollerHeight * 2);
        //Btm right
        var pos = toGlobalCoord(6, 5);
        p.fill(BLUE);
        p.rect(pos.x * height - rollerHeight * 2, pos.y * height - blackWidth - rollerWidth, rollerHeight, rollerWidth);
        p.fill(RED);
        p.rect(pos.x * height - rollerHeight, pos.y * height - blackWidth - rollerWidth, rollerHeight, rollerWidth);
        p.fill(0);
        p.rect(pos.x * height - rollerHeight * 2, pos.y * height - blackWidth * 2 - rollerWidth, rollerHeight * 2, blackWidth);
        p.rect(pos.x * height - rollerHeight * 2, pos.y * height - blackWidth, rollerHeight * 2, blackWidth);
        //Btm left
        pos = toGlobalCoord(5, 6);
        p.fill(BLUE);
        p.rect(pos.x * height - blackWidth - rollerWidth, pos.y * height - rollerHeight, rollerWidth, rollerHeight);
        p.fill(RED);
        p.rect(pos.x * height - blackWidth - rollerWidth, pos.y * height - 2 * rollerHeight, rollerWidth, rollerHeight);
        p.fill(0);
        p.rect(pos.x * height - blackWidth, pos.y * height - rollerHeight * 2, blackWidth, rollerHeight * 2);
        p.rect(pos.x * height - rollerWidth - 2 * blackWidth, pos.y * height - rollerHeight * 2, blackWidth, rollerHeight * 2);
    }

    //Plot points 
    {
        var selectedCopy = selectedPlotButtonIndex;
        if (selectedPlotButtonIndex !== -1) {
            var pt = plotPoints[selectedPlotButtonIndex];
            //Set fill color to different turqoise
            pt.inner = p.color(0, 180, 255);
            var pos = pt.position();
            var fieldPos = toFieldCoordV(pos);
            p.text("X: " + (fieldPos.x * 24 - 72).toFixed(2) + " Y: " + (-fieldPos.y * 24 + 72).toFixed(2), 1 * height, 75 * height);
        }
        p.noFill();
        for (const pt of plotPoints) {
            pt.draw();
            //only allow the buttons to move if objects can move or the plot points can move and
            //none of the goal buttons are pressed
            if ((allowObjectsMove || allowPlotPointsMove) && !goalBtns.reduce((prev, val) => prev || val.pressing || val.pressed, false)) {
                pt.handlePress();   
            }
            if (pt.pressing) { 
                allowObjectsMove = false;
                allowPlotPointsMove = true;
                selectedPlotButtonIndex = plotPoints.indexOf(pt);
            }
            // console.log(pt);
            if (!pt.pressing && pt.pressed) {
                allowPlotPointsMove = false;
                allowObjectsMove = true;
            }
        }
        if (selectedCopy !== -1) {
            plotPoints[selectedCopy].inner = p.color(0, 250, 250);
        }
    }

    //Robot
    {
        drawBot(botPos, botAngle, 255);
    }

}