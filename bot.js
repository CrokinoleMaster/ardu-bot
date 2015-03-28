var five = require('johnny-five');
var board = new five.Board();
var keypress = require('keypress');
var _ = require('lodash-compat');
var temporal = require('temporal');

keypress(process.stdin);

board.on('ready', function() {
  var reset = new five.Pin(4);
  reset.high();

  var left_wheel = new five.Servo.Continuous(3);
  var right_wheel = new five.Servo.Continuous(5);
  var sonar_servo = new five.Servo({
    pin: 10,
    center: true,
    range: [30, 150]
  });

  var stopMove = function() {
    left_wheel.stop();
    right_wheel.stop();
  }
  var moveForward = function() {
    left_wheel.cw();
    right_wheel.ccw();
  }
  var moveBack = function() {
    left_wheel.ccw();
    right_wheel.cw();
  }
  var turnLeft = function() {
    left_wheel.ccw();
    right_wheel.ccw();
  }
  var turnRight = function() {
    left_wheel.cw();
    right_wheel.cw();
  }

  stopMove();

  process.stdin.resume(); process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true);

  process.stdin.on('keypress', function(ch, key) {

    if (!key) return;

    // if (key.name == 'q') {
    //   console.log('quit');
    //   process.exit();
    // } else if (key.name == 'down') {
    //   moveBack();
    // } else if (key.name == 'up') {
    //   moveForward();
    // } else if (key.name == 'left') {
    //   turnLeft();
    // } else if (key.name == 'right') {
    //   turnRight();
    // } else if (key.name == 'space') {
    //   stopMove();
    // }

  });

  var dist = 0;

  var lcd = new five.LCD({
    pins: [12, 11, 6, 7, 8, 9],
    rows: 2,
    cols: 16
  });

  var sonar = new five.Ping({
    pin: 13,
    freq: 500,
    pulse: 800
  });

  var data = [];
  var lastTurn = '';
  var safeAngleMax = 120;
  var safeAngleMin = 60;
  var safeDist = 25;

  var loop = function() {
    console.log('loop')
    var angle = 30;
    var dir = 1;
    temporal.loop(200, function() {
      sonar_servo.to(angle);
      var cm = sonar.cm;
      if (cm < safeDist && angle <= safeAngleMax && angle >= safeAngleMin) {
        stopMove();
      }
      data.push({angle: angle, dist: cm});
      if (angle == 150 || angle == 30) {
        if (angle == 150) {dir = 0}
        if (angle == 30) {dir = 1}
        byDist = _.sortBy(data, function(n) {
          return n.dist;
        });
        byAngle = _.sortBy(data, function(n) {
          return n.angle;
        });
        safeDists = _.filter(byAngle, function(n) {
          return n.angle > safeDist;
        });
        console.log(byAngle);
        if (_.filter(byDist, function(n) {
          return n.angle <= safeAngleMax && n.angle >= safeAngleMin && n.dist < safeDist;
        }).length > 0) {
          stopMove();
          temporal.delay(500, stopMove);
          if (safeDists[safeDists.length/2].angle > 90 && lastTurn !== 'right') {
            turnLeft();
            lastTurn = 'left';
          } else {
            turnRight();
            lastTurn = 'right';
          }
        } else {
          moveForward();
          lastTurn = 'forward';
        }
        data = [];
      }
      if (dir == 1) {
        angle+=10;
      } else {
        angle-=10;
      }
    });
  }
  loop();


  this.repl.inject({
    lcd : lcd,
    sonar: sonar,
    sonarServo: sonar_servo
  })

});
