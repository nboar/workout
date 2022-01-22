(function () {
    let calculateReps = function (weight, repin, repout) {
      let pers = [
        100,
        94,
        91,
        88,
        86,
        83,
        82,
        78,
        77,
        73,
        ]
        return Math.round(weight / pers[repin - 1] * pers[repout - 1] * 2) / 2;
    };

    let getData = function () {
      fetch("https://script.google.com/macros/s/AKfycbx6wZIXE6en7q_3dqf8aJaiBZBTZnElsvZKGy4tfpjkx4ref-hXw1Po93u7P5aotrxg/exec").then(function(response) {
        return response.json();
      }).then(function(data) {
        onGet(data);
      });
    };

    let rndHalf = function (num) {
      return Math.round(num * 2) / 2;
    };

    let rnd5 = function (num) {
      return Math.round(num / 5) * 5;
    };

    let onGet = function (data) {
      console.log('here');
      data.lifts = data.lifts.map(function (row) {
        row.date = new Date(row.date);
        return row;
      }).filter(row => row.date > new Date("11/1/2021"));
      // console.log(data);

    // Strict Press, Deadlift, Bench Press, Front Squat, Row, Power Clean

      google.charts.setOnLoadCallback(buildFigure(data, "Back Squat"));
      google.charts.setOnLoadCallback(buildFigure(data, "Strict Press"));
      google.charts.setOnLoadCallback(buildFigure(data, "Deadlift"));
      google.charts.setOnLoadCallback(buildFigure(data, "Bench Press"));
      google.charts.setOnLoadCallback(buildFigure(data, "Front Squat"));
      google.charts.setOnLoadCallback(buildFigure(data, "Row"));
      google.charts.setOnLoadCallback(buildFigure(data, "Power Clean"));
    };

    let buildTable = function (tableInfo, identifier) {
      return function () {
        let tableDate = google.visualization.arrayToDataTable(tableInfo);
        let table = new google.visualization.Table(document.getElementById(identifier));
        table.draw(tableDate, {showRowNumber: false});
      }
    };

    let buildFigure = function (dataObj, identifier) {
      let data = dataObj.lifts;
      let goals = dataObj.goals
        .filter(a => a.movement === identifier)
        .map(function (goal) {
          goal.date = new Date(goal.date);
          return goal;
        })
        .sort((a, b) => a.date - b.date);
      let program = dataObj.program.filter(a => a.movement === identifier);
      let divName = identifier.toLowerCase().replace(/\s/,"_");
      let div = document.getElementById("main");

      console.log(data, goals, program);

      div.innerHTML += 
        "<h2>" + identifier + "</h2>" +
        '<div class="col-sm-12 col-md-6" id="' + divName + '"></div>' +
        '<div style="margin-top: 20px;margin-bottom: 20px" class="col-sm-12 col-md-6">' +
        '<p id="' + divName + '_info"></p>' +
        '<p id="' + divName + '_nextTable"></p>' +
        "</div>";

      return function () {

        //Movement	Weight	Date	Difficulty
        // movement	weight	date	difficulty	sets	repetitions
        let figData = [["Date", "Calculated 1RM", "Work", "Max attempted"]];
        let byDateData = {};
        let summaryData = [];
        data
          .filter(a => a.movement === identifier)
          .forEach(function (lift) {
            byDateData[lift.date.toDateString()] = 
              byDateData[lift.date.toDateString()] || [];
            byDateData[lift.date.toDateString()].push(lift);
        });
        

        Object.keys(byDateData).forEach(function (date) {
          let oneRepMax = 0;
          let maxAttempt = 0;
          let totalWork = 0;
          let totalByWeight = {};
          let difficulty;
          byDateData[date].forEach(function (lift) {
            totalByWeight[lift.weight] = totalByWeight[lift.weight] || 0;
            totalByWeight[lift.weight] += lift.repetitions * lift.sets;
            let thisRep = calculateReps(lift.weight, lift.repetitions, 1)
            oneRepMax = Math.max(oneRepMax, thisRep);
            maxAttempt = Math.max(maxAttempt, lift.weight);
            totalWork += lift.weight * lift.repetitions * lift.sets;
            difficulty = lift.difficulty;
          });
          figData.push([new Date(date), oneRepMax, totalWork, maxAttempt]);
          summaryData.push({
            date: new Date(date),
            difficulty: difficulty,
            work: totalWork,
            oneRM: oneRepMax,
            counts: Object.keys(totalByWeight)
              .map(key => [key, totalByWeight[key]])
          });
        });


        // set up information table
        let last = summaryData.sort((a, b) => a.date - b.date).pop();
        console.log("last", last);

        let reps = program[0].repetitions;
        let sets = program[0].sets;
        let goal = calculateReps(goals[0]["weight (1RM)"], 1, reps);

        let infoDiv = document.getElementById(divName + '_info');
        let tableDiv = divName + '_nextTable';

        // display goals and last
        infoDiv.innerHTML = 
          "<b>Goal (" + goals[0].date.toLocaleDateString("en-US") + "):</b> " + 
          goal + " lbs " + reps + "RM" +
          " (" + goals[0]["weight (1RM)"] + " lbs 1RM)" +
          "<br />" +
          "<b>Last:</b> " + last.counts.map(a => a[0] + " lbs x " + a[1] + " reps").join(', ') +
          " (1RM: " +  last.oneRM + " lbs)";


        //create table for next lift
        let equalReps = calculateReps(last.oneRM, 1, reps);
        let equalWork = rndHalf(last.work / (sets * reps));

        let nextTable = [
          ["Metric", "Equivalent (lbs)", "+1.5% (lbs)", "+3% (lbs)", "+4.5% (lbs)"],
          [
            reps + "-rep",
            equalReps,
            rndHalf(equalReps + goal * 0.015),
            rndHalf(equalReps + goal * 0.03),
            rndHalf(equalReps + goal * 0.045)
          ],
          [
            "Work (" + (sets * reps) + " reps)",
            equalWork,
            rndHalf(equalWork + goal * 0.015),
            rndHalf(equalWork + goal * 0.03),
            rndHalf(equalWork + goal * 0.045)
          ]
        ];
        google.charts.setOnLoadCallback(buildTable(nextTable, tableDiv)); 
        console.log(nextTable);        

        let visData = google.visualization.arrayToDataTable(figData);

        let options = {
          width: "100%",
          height: 370,
          pointSize: 8,
          legend: {
            position: "top"
          },
          hAxis: {
            // title: "Date"
          },
          series: {
            // Gives each series an axis name
            0: {targetAxisIndex: 0},
            1: {targetAxisIndex: 1},
            2: {targetAxisIndex: 0},
          },
          vAxes: {
            0: {title: 'Calculated Weight 1RM (lbs)'},
            1: {title: 'Work total (lbs)'}
          }
        };

        console.log(figData);
        let wrap = new google.visualization.ChartWrapper({
          chartType:'LineChart',
          dataTable: visData,
          options: options,
          containerId:divName,
        });

        wrap.draw();
      };
    };

    //actually get things started
    google.charts.load('current', {'packages':['table']});
    getData();
}())