//The plot point callback
var driveDistanceButton;
$("button.ProgInput.Point").on("click", function () {
  var text = $("input.ProgInput.Point").val();
  var arr = text.split(",");
  //Do some weird conversion magic idk why it works but it does
  var x = parseFloat(arr[0]) / 24 + 3;
  var y = -parseFloat(arr[1]) / 24 + 3;
  var pt = toGlobalCoord(x, y);
  // console.log(x, y);
  var pointBtn = new MovingButton(
    pt.x - 1.5 / 2,
    pt.y - 1.5 / 2,
    1.5,
    1.5,
    p.color(0, 0, 0, 1),
    p.color(0, 250, 250),
    p.color(0, 230, 230),
    p.color(0, 210, 210),
    "",
    0,
    0,
  );
  plotPoints.push(pointBtn);
});
var height, p;
var YELLOW, RED, BLUE, BLUE_DARK, RED_DARK, rings, PURPLE, POS, POS_TOP_LEFT;

var botWidth = 13;
var botHeight = 14;

//Converts tiles to inches
const FIELD_TO_NORM = 72.0 / 3.0;
var pathBtnArr = [],
  goalBtns = [];
var allowPlotPointsMove = false;
var field = {
  //The width of the tiles in height percent
  tileWidth: 15,
  //The field start
  startX: 24,
  //The field start
  startY: 4,
  //The end of the field, these are functions called in init that calculate it
  endX: function () {
    return this.tileWidth * 6 + this.startX;
  },
  endY: function () {
    return this.tileWidth * 6 + this.startY;
  },
  size: 0,
};

var stage = 0;
//An "enum" for the different scenes
var stages = {
  init: 0,
  BotPosition: 1,
  Programming: 2,
  "Edit driveTo": 3,
  "Edit followPath": 4,
  "Edit turnTo": 5,
  "Edit backwardsFollow": 6,
  "Edit backInto": 7,
  "Edit faceTarget": 8,
  "Edit driveDistance": 9,
  "Edit backwardsDriveDistance": 10,
};
//An "enum" for what the last type of command was
var cmdType = {
  Mvt: 0,
  NonMvt: 1,
};

var botPos, botAngle;
//The programming bank
var buttonAndAction = [];
//Past moves for ctrl-z
var pastMvts = [];
//The list of programs
var program = [];
var allowObjectsMove = true;
var plotPoints = [];

//The index of the selected plot point
var selectedPlotButtonIndex = -1;
//Yooo i figured out how to use generator functions just for this
//These get x and y values for the programming bank

const compile = () => {
  var ret = `wc.estimateStartPos(PVector(${limDecimal(pastMvts[0][0].x * FIELD_TO_NORM)}, ${limDecimal(-pastMvts[0][0].y * FIELD_TO_NORM)}), ${limDecimal(pastMvts[0][1])});\n`;
  for (var i of program) {
    ret += "\t" + i[1];
    ret += "\n";
  }
  return ret;
};

var diskPos;
const DISK_WIDTH = 5.5;
function drawBot(pt, r, t) {
  var upperLeftCorner = POS_TOP_LEFT.copy();
  // var botWidth = 13.5 / 24;
  // var botHeight = 14 / 24;
  var upperRightCorner = p.createVector(
    upperLeftCorner.x + botWidth / 24,
    upperLeftCorner.y,
  );
  var btmLeftCorner = p.createVector(
    upperLeftCorner.x,
    upperLeftCorner.y + botHeight / 24,
  );
  var btmRightCorner = p.createVector(
    upperLeftCorner.x + botWidth / 24,
    upperLeftCorner.y + botHeight / 24,
  );
  //var innerLeft = p.createVector(upperLeftCorner.x + 3.5 / 24, upperLeftCorner.y + botHeight - 3 / 24);
  //var innerRight = p.createVector(upperLeftCorner.x + botWidth - 3.5 / 24, upperLeftCorner.y + botHeight - 3 / 24);
  //var outerLeft = p.createVector(upperLeftCorner.x + 3.5 / 24, upperLeftCorner.y + botHeight);
  //var outerRight = p.createVector(upperLeftCorner.x + botWidth - 3.5 / 24, upperLeftCorner.y + botHeight);
  var arr = [
    upperRightCorner,
    btmRightCorner /*, outerRight, innerRight, innerLeft, outerLeft*/,
    btmLeftCorner,
    upperLeftCorner,
  ];

  var pos = p5.Vector.add(pt, [3, 3]);
  //Do some rotation magic to get the bot to the right point
  for (var i of arr) {
    i.rotate((r * p.PI) / 180);
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
  p.line(
    upperLeftCorner.x * height,
    upperLeftCorner.y * height,
    upperRightCorner.x * height,
    upperRightCorner.y * height,
  );
  p.stroke(255, 255, 255, t);
  p.beginShape();
  for (var i of arr) {
    p.vertex(i.x * height, i.y * height);
  }
  p.endShape();
}

function fakeBot(pt, r) {
  drawBot(pt, r, 150);
}
var bankOff = 120;

//Draws the prog bank
function programmingBank() {
  p.fill(60);
  p.noStroke();
  p.rect(
    bankOff * height,
    0 * height,
    p.width - bankOff * height,
    100 * height,
  );
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

var commitBtn,
  undoBtn,
  deleteBtn,
  compileBtn,
  toNextBtn,
  addBtn,
  commitBtn,
  deleteBtn,
  algorithmChange,
  angleSlide,
  editDriveToPos;
var driveAlgorithm = 0;
var algorithms = ["Pure Pursuit", "Ramsete", "Basic PID"];
var algToVar = {
  "Pure Pursuit": "&purePursuit",
  Ramsete: "&ramsete",
  "Basic PID": "&pidController",
};
function editDriveTo(isBackward) {
  editDriveToPos.handlePress();
  allowObjectsMove = false;
  editDriveToPos.isDone();

  var fieldPos = toFieldCoordV(editDriveToPos.position());
  fieldPos.sub(3, 3);

  var angle =
    (botPos.angleTo(fieldPos) * 360) / p.TWO_PI + 90 * (isBackward * -2 + 1);
  //Get a fancy path to draw
  var path = bezierCurve(new VectorArr([botPos, fieldPos]), 0.05);
  //Draw that fancy path
  for (var i of path) {
    var pt = toGlobalCoordV(p5.Vector.add(i, p.createVector(3, 3)));
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
    p.point(pt.x * height, pt.y * height);
  }
  //Show them where the bot is
  fakeBot(fieldPos, angle);
  //Draw utiilities
  p.textSize(2.5 * height);
  editDriveToPos.draw();
  deleteBtn.draw();
  deleteBtn.handlePress();
  commitBtn.draw();
  commitBtn.handlePress();
  if (deleteBtn.isDone()) {
    //ok nvm cancel
    stage = stages["Programming"];
  } else if (commitBtn.isDone()) {
    //add to the list
    pastMvts.push([botPos, botAngle]);
    stage = stages["Programming"];
    var str = `wc.${isBackward ? "backInto" : "driveTo"}(${limDecimal(fieldPos.x * FIELD_TO_NORM)}, ${-limDecimal(fieldPos.y * FIELD_TO_NORM)});`;
    program.push([cmdType["Mvt"], str]);
    addListEl(str);
    //Set bot position
    botPos = fieldPos;
    botAngle = angle;
  }
}
function editFollowPath(isBackward) {
  allowObjectsMove = false;
  for (var i of pathBtnArr) {
    i.handlePress();
    if (i.pressing) {
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
  var angle =
    (pos.arr[pos.size() - 2].angleTo(pos.last()) * 360) / p.TWO_PI +
    90 * (isBackward * -2 + 1);
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
  } else if (commitBtn.isDone()) {
    pastMvts.push([botPos, botAngle]);
    stage = stages["Programming"];
    pos.arr.shift();
    var str = ""; //`PVector(${limDecimal(botPos.x * FIELD_TO_NORM)}, ${limDecimal(botPos.y * FIELD_TO_NORM)})`;
    for (var i of pos) {
      str += `PVector(${limDecimal(i.x * FIELD_TO_NORM)}, ${-limDecimal(i.y * FIELD_TO_NORM)}), `;
    }
    str = str.substring(0, str.length - 2);
    var command = `wc.${isBackward ? "backwardsFollow" : "followPath"}(${algToVar[algorithmChange.msg || "Pure Pursuit"]}, {${str}});`;
    program.push([cmdType["Mvt"], command]);
    addListEl(command);
    botPos = fieldPos;
    botAngle = angle;
  }
  if (addBtn.isDone()) {
    pathBtnArr.push(basicMoving());
  }
}
//Just dont look in here
const s = (pi) => {
  p = pi;

  pi.setup = function () {
    pi.createCanvas(p.windowWidth, p.windowHeight);
    $("canvas").contextmenu((e) => {
      e.preventDefault();
    });
  };
  stage = stages["init"];
  angleSlide = new Slide(
    10,
    96,
    50,
    2,
    360,
    p.color(0, 0, 0),
    p.color(255, 0, 0),
    p.color(255, 255, 0),
  );
  toNextBtn = new Button(
    120,
    90,
    16,
    8,
    p.color(0, 0, 0),
    p.color(0, 255, 0),
    p.color(0, 230, 0),
    p.color(0, 200, 0),
    "Next",
    2.5,
    5.5,
  );
  undoBtn = new Button(
    5,
    93,
    17,
    5.5,
    p.color(0),
    p.color(200),
    p.color(180),
    p.color(160),
    "Undo",
    2.5,
    3.5,
  );
  compileBtn = new Button(
    5,
    85,
    17,
    5.5,
    p.color(0),
    p.color(200),
    p.color(180),
    p.color(160),
    "Compile",
    2.5,
    3.5,
  );
  editDriveToPos = basicMoving();
  addBtn = new Button(
    80,
    95,
    4,
    4,
    p.color(0, 0, 0),
    p.color(200),
    p.color(180),
    p.color(160),
    "+",
    0.9,
    3.0,
  );
  commitBtn = new Button(
    120,
    90,
    18,
    8,
    p.color(0, 0, 0),
    p.color(0, 255, 0),
    p.color(0, 230, 0),
    p.color(0, 200, 0),
    "Commit",
    2.5,
    5.5,
  );
  deleteBtn = new Button(
    5,
    90,
    17,
    8,
    p.color(0, 0, 0),
    p.color(255, 0, 0),
    p.color(230, 0, 0),
    p.color(200, 0, 0),
    "Delete",
    2.5,
    5.5,
  );
  algorithmChange = new Button(
    120,
    70,
    17,
    8,
    p.color(0, 0, 0),
    p.color(0, 0, 255),
    p.color(0, 0, 230),
    p.color(0, 0, 200),
    "",
    2.5,
    5.5,
  );
  var turnToAngle = basicMoving();

  driveDistanceButton = basicMoving();
  pi.draw = function () {
    if (stage !== 0) {
      drawField();
    }
    switch (stage) {
      case stages["init"]:
        //Hide stuff
        $("input").hide();
        initVars();
        stage = stages["BotPosition"];
        break;
      case stages["BotPosition"]:
        $(".Start").show();
        //okok, we need to prevent people from moving stuff
        allowObjectsMove = false;
        p.fill(255);
        //yess comic sans
        p.textFont("Comic Sans MS");
        p.textSize(3 * height);
        p.text(
          "Position the robot",
          1 * height,
          50,
          (field.startX - 2) * height,
          300,
        );
        //Adjust the angle
        // angleSlide.adjust();
        // angleSlide.draw();
        // botAngle = angleSlide.getVal();
        $("[name='Angle']").on("change", function (e) {
          botAngle = e.target.value * 1;
        });
        p.textSize(2.5 * height);
        p.fill(255, 255, 255);

        p.text(
          `Bot Angle: ${Math.round(botAngle)}`,
          (angleSlide.x + angleSlide.w + 5) * height,
          (angleSlide.y + angleSlide.h) * height,
        );
        toNextBtn.handlePress();
        p.textSize(2.5 * height);
        toNextBtn.draw();
        //Yoo its time from programming
        if (toNextBtn.isDone()) {
          $("ul").append(
            `<li>[${limDecimal(botPos.x)}, ${limDecimal(botPos.y)}], ${limDecimal(botAngle)}</li>`,
          );
          allowObjectsMove = true;
          $(".ProgInput").show();

          pastMvts.push([botPos, botAngle]);
          stage = stages["Programming"];
        }
        break;
      case stages["Programming"]:
        $(".Start").hide();
        allowObjectsMove = true;
        p.fill(255);
        p.textFont("Comic Sans MS");
        p.textSize(3 * height);
        //Tell people that they can prog their bot now
        p.text(
          "Program the robot",
          1 * height,
          50,
          (field.startX - 2) * height,
          300,
        );
        undoBtn.handlePress();
        undoBtn.draw();
        compileBtn.handlePress();
        compileBtn.draw();
        if (compileBtn.isDone()) {
          var prog = compile();
          console.log(prog);
          //hit ctrl-c for them
          window.navigator.clipboard.writeText(prog);
          //Tell them we did something cool
          window.alert("Program Copied!");
        }
        //hit ctrl-z
        if (undoBtn.isDone() && program.length !== 0) {
          var last = program[program.length - 1];
          if (last[0] == cmdType["Mvt"]) {
            var pose = pastMvts[pastMvts.length - 1];
            botPos = pose[0];
            botAngle = pose[1];
            pastMvts.pop();
          }
          popListEl();
          program.pop();
        }
        //Draw the prog bank
        programmingBank();
        break;
      //please don't look at the code in the rest of this switch
      case stages["Edit driveTo"]:
        editDriveTo(false);
        break;
      case stages["Edit backInto"]:
        editDriveTo(true);
        break;
      case stages["Edit followPath"]:
        //var handleOtherPress = true;
        editFollowPath(false);
        break;
      case stages["Edit backwardsFollow"]:
        editFollowPath(true);
        break;
      case stages["Edit turnTo"]:
        turnToAngle.handlePress();
        allowObjectsMove = true;
        if (turnToAngle.pressing) {
          allowObjectsMove = false;
        }
        turnToAngle.isDone();
        var fieldPos = toFieldCoordV(turnToAngle.position());
        fieldPos.sub(3, 3);

        p.stroke(255, 255, 0, 200);
        p.strokeWeight(1);
        var botCenter = POS.copy();
        botCenter.mult(-1);
        botCenter.rotate((botAngle * p.PI) / 180.0);
        botCenter.add(botPos);

        var fieldCoord = toGlobalCoordV(
          p5.Vector.add(fieldPos, p.createVector(3, 3)),
        );
        var botCoord = toGlobalCoordV(
          p5.Vector.add(botCenter, p.createVector(3, 3)),
        );
        var newGps = POS.copy();
        var angle = (botCenter.angleTo(fieldPos) * 360) / p.TWO_PI + 90;
        newGps.rotate((angle * p.PI) / 180.0);
        botCenter.add(newGps);
        p.line(
          fieldCoord.x * height,
          fieldCoord.y * height,
          botCoord.x * height,
          botCoord.y * height,
        );
        fakeBot(botCenter, angle);
        p.textSize(2.5 * height);
        turnToAngle.draw();
        deleteBtn.draw();
        deleteBtn.handlePress();
        commitBtn.draw();
        commitBtn.handlePress();
        if (deleteBtn.isDone()) {
          stage = stages["Programming"];
        } else if (commitBtn.isDone()) {
          pastMvts.push([botPos, botAngle]);
          stage = stages["Programming"];
          program.push([cmdType["Mvt"], `wc.turnTo(${limDecimal(angle)});`]);
          addListEl(`wc.turnTo(${limDecimal(angle)});`);
          botAngle = angle;
          botPos = botCenter;
        }
        break;
      case stages["Edit driveDistance"]:
        allowObjectsMove = false;
        var angle = botAngle;
        var off = p.createVector(0, -100);
        off.rotate((angle * p.PI) / 180.0);
        var pos = p5.Vector.add(p.createVector(3, 3), botPos);
        driveDistanceButton.setConstraints([
          toGlobalCoordV(pos),
          p5.Vector.add(toGlobalCoordV(pos), off),
        ]);
        driveDistanceButton.draw();
        driveDistanceButton.handlePress();
        p.textSize(2.5 * height);
        deleteBtn.draw();
        deleteBtn.handlePress();
        commitBtn.draw();
        commitBtn.handlePress();
        var fieldPos = toFieldCoordV(driveDistanceButton.position());
        fieldPos.sub(3, 3);
        fakeBot(fieldPos, angle);
        if (deleteBtn.isDone()) {
          stage = stages["Programming"];
        } else if (commitBtn.isDone()) {
          pastMvts.push([botPos, botAngle]);
          stage = stages["Programming"];
          program.push([
            cmdType["Mvt"],
            `wc.driveDistance(${limDecimal(fieldPos.dist(botPos) * 24)});`,
          ]);
          addListEl(
            `wc.driveDistance(${limDecimal(fieldPos.dist(botPos) * 24)});`,
          );
          botPos = fieldPos;
          botAngle = angle;
        }
        break;
      case stages["Edit backwardsDriveDistance"]:
        var angle = botAngle;
        allowObjectsMove = false;
        var off = p.createVector(0, 100);
        off.rotate((angle * p.PI) / 180.0);
        var pos = p5.Vector.add(p.createVector(3, 3), botPos);
        driveDistanceButton.setConstraints([
          toGlobalCoordV(pos),
          p5.Vector.add(toGlobalCoordV(pos), off),
        ]);
        driveDistanceButton.draw();
        driveDistanceButton.handlePress();
        p.textSize(2.5 * height);
        deleteBtn.draw();
        deleteBtn.handlePress();
        commitBtn.draw();
        commitBtn.handlePress();
        var fieldPos = toFieldCoordV(driveDistanceButton.position());
        fieldPos.sub(3, 3);
        fakeBot(fieldPos, angle);
        if (deleteBtn.isDone()) {
          stage = stages["Programming"];
        } else if (commitBtn.isDone()) {
          pastMvts.push([botPos, botAngle]);
          stage = stages["Programming"];
          program.push([
            cmdType["Mvt"],
            `wc.backwardsDriveDistance(${limDecimal(fieldPos.dist(botPos) * 24)});`,
          ]);
          addListEl(
            `wc.backwardsDriveDistance(${limDecimal(fieldPos.dist(botPos) * 24)});`,
          );
          botPos = fieldPos;
          botAngle = angle;
        }
        break;
      case stages["Edit faceTarget"]:
        turnToAngle.handlePress();
        allowObjectsMove = true;
        if (turnToAngle.pressing) {
          allowObjectsMove = false;
        }
        turnToAngle.isDone();
        var fieldPos = toFieldCoordV(turnToAngle.position());
        fieldPos.sub(3, 3);

        p.stroke(255, 255, 0, 200);
        p.strokeWeight(1);
        var botCenter = POS.copy();
        botCenter.mult(-1);
        botCenter.rotate((botAngle * p.PI) / 180.0);
        botCenter.add(botPos);

        var fieldCoord = toGlobalCoordV(
          p5.Vector.add(fieldPos, p.createVector(3, 3)),
        );
        var botCoord = toGlobalCoordV(
          p5.Vector.add(botCenter, p.createVector(3, 3)),
        );
        var newGps = POS.copy();
        var angle = (botCenter.angleTo(fieldPos) * 360) / p.TWO_PI + 90;
        newGps.rotate((angle * p.PI) / 180.0);
        botCenter.add(newGps);
        p.line(
          fieldCoord.x * height,
          fieldCoord.y * height,
          botCoord.x * height,
          botCoord.y * height,
        );
        fakeBot(botCenter, angle);
        p.textSize(2.5 * height);
        turnToAngle.draw();
        deleteBtn.draw();
        deleteBtn.handlePress();
        commitBtn.draw();
        commitBtn.handlePress();
        if (deleteBtn.isDone()) {
          stage = stages["Programming"];
        } else if (commitBtn.isDone()) {
          pastMvts.push([botPos, botAngle]);
          stage = stages["Programming"];
          program.push([
            cmdType["Mvt"],
            `wc.faceTarget({${limDecimal(fieldPos.x * FIELD_TO_NORM)}, ${limDecimal(fieldPos.y * -FIELD_TO_NORM)}});`,
          ]);
          addListEl(
            `wc.faceTarget({${limDecimal(fieldPos.x * FIELD_TO_NORM)}, ${limDecimal(fieldPos.y * -FIELD_TO_NORM)}});`,
          );
          botAngle = angle;
          botPos = botCenter;
        }
        break;
    }
  };
  pi.mouseDragged = function () {
    switch (stage) {
      case 1:
        //Move the bot around
        var old = botPos.copy();
        botPos = toFieldCoord(p.mouseX, p.mouseY);
        botPos.x -= 3;
        botPos.y -= 3;
        if (Math.abs(botPos.x) > 3 || Math.abs(botPos.y) > 3) {
          botPos = old;
        }
        break;
    }
  };
  pi.mouseClicked = function (e) {};
  pi.mouseReleased = function (e) {
    e.preventDefault();
    //Delete plot points
    if (p.mouseButton === p.RIGHT) {
      for (var btn of plotPoints) {
        if (btn.pressing) {
          //Remove it from the array
          var index = plotPoints.indexOf(btn);
          if (index > -1) {
            plotPoints.splice(index, 1);
          }
          if (index == selectedPlotButtonIndex) {
            selectedPlotButtonIndex = -1;
          }
          if (selectedPlotButtonIndex > index) {
            selectedPlotButtonIndex--;
          }
        }
      }
    }
  };
};
