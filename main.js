(function () {

	if ('wakeLock' in navigator) {
	  // Screen Wake Lock API supported
	  // Create a reference for the Wake Lock.

		// create an async function to request a wake lock
		navigator.wakeLock.request('screen').then(function () {
			console.log('not sleeping...');
		}).catch(function (err) {
			console.error(err);
		});
	}

	let createRepTable = function (weight) {
		// category, weight, per side, change
		// cats: 60, 80, 90, Working
		let a60 = rnd5(.6 * weight);
		let a80 = rnd5(.8 * weight);
		let a90 = rnd5(.9 * weight);
		let table = [
			["Percentage", "Weight", "Per Side", "Increase"],
			["60%", a60, (a60 - 45) / 2, a60 - 45],
			["80%", a80, (a80 - 45) / 2, a80 - a60],
			["90%", a90, (a90 - 45) / 2, a90 - a80],
			["100%", weight, (weight - 45) / 2, weight - a90]
		];

		return table;
	};

	let createBootTable = function (arr) {
		let retObj = {};
		let randomID = randStr();
		let htmlString = "";
		htmlString += '<table class="table table-sm">';
		arr.forEach(function (row, j) {
			let td = "td";
			if (j === 0) {
				htmlString += "<thead>";
				td = "th";
			} else if (j === 1) {
				htmlString += "<tbody>"
			}
			row.forEach(function (entry, i) {
				htmlString += "<" + td + ">";
				htmlString += entry;
				htmlString += "</" + td + ">";
			});
			htmlString += "</tr>"
			if (j === 0) {
				htmlString += "</thead>"
			}
		});
		htmlString += "</tbody></table>"

		return htmlString;
	}

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
    	let rnd1 = Math.round(num / 5) * 5;
    	let rnd2 = Math.round((num + 2.5) / 5) * 5;
    	let rnd3 = Math.round((num - 2.5) / 5) * 5;
    	let ret = rnd1

    	if (rnd1 / 10 === Math.round(rnd1/10)) {
    		ret = rnd2;
    	}

    	if (rnd2 / 10 === Math.round(rnd2/10)) {
    		ret = rnd3;
    	}

      return ret;
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

    let randStr = function () {
    	return Math.random().toString().replace(/\0\./, "");
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
        '<div class="col-md-12 col-lg-6" id="' + divName + '"></div>' +
        '<div class="col-md-12 col-lg-6">' +
        '<p id="' + divName + '_nextTable"></p>' +
        '<p id="' + divName + '_info"></p>' +
        '<p id="' + divName + '_goalProject"></p>' +
        '<p id="' + divName + '_workoutAmt"></p>' +
        '<p id="' + divName + '_workout"></p>' +
        "</div>" +
        "<hr />";

      return function () {
      	let infoDiv = document.getElementById(divName + '_info');
        let tableDiv = document.getElementById(divName + '_nextTable');
        let workoutForm = document.getElementById(divName + '_workoutAmt');
        let workoutDiv = document.getElementById(divName + '_workout');
        let goalProject = document.getElementById(divName + '_goalProject');

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
        let last = summaryData.sort((a, b) => b.date - a.date)[0];
        // console.log("last", last);

        let reps = program[0].repetitions;
        let sets = program[0].sets;
        let thisGoal = goals[0];
        let goalIndex = 0;
        


        while (last.oneRM >= thisGoal["weight (1RM)"] && goalIndex < goals.length - 1) {
        	goalIndex += 1;
        	thisGoal = goals[goalIndex];
        }
        goal = calculateReps(thisGoal["weight (1RM)"], 1, reps);

        // display goals and last
        infoDiv.innerHTML = 
          "<p><b>Last:</b> " + last.counts.sort((a, b) => b[0] - a[0]).map(a => a[0] + " lbs x " + a[1] + " reps").join(', ') +
          " (1RM: " +  last.oneRM + " lbs)" +
          "</p>" +
          "<p><b>Goal (" + thisGoal.date.toLocaleDateString("en-US") + "):</b> " + 
          goal + " lbs " + reps + "RM" +
          " (" + thisGoal["weight (1RM)"] + " lbs 1RM)</p>";

        // work on goal projection
        //goalProject
        let toGoal = (thisGoal["weight (1RM)"] - last.oneRM) /  thisGoal["weight (1RM)"];
        let workOutsToTotal = Math.floor((thisGoal.date - last.date) / 1000 / 60 / 60 / 24 / program[0].cycleLength);
        console.log(toGoal, workOutsToTotal);

        goalProject.innerHTML = Math.ceil(toGoal / workOutsToTotal * 1000) / 10 + "% increase needed in each of " + workOutsToTotal + " sessions to reach goal.";


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

        tableDiv.innerHTML = createBootTable(nextTable);
        console.log(nextTable);

        // build next weight area
        let weightid = "weight" + randStr();
        workoutForm.innerHTML = 
        	'<div class="mb-3">' +
			'<label for="' + weightid + '" class="form-label"><b>Work Set Weight</b></label>' + 
			'<input class="form-control" id="' + weightid + '" value=" '+ equalReps +'">' +
			'</div>'

		let weightEntry = document.getElementById(weightid);
		weightEntry.onchange = function (evt) {
			workoutDiv.innerHTML = createBootTable(createRepTable(evt.target.value));
		};

		workoutDiv.innerHTML = createBootTable(createRepTable(equalReps));

        let visData = google.visualization.arrayToDataTable(figData);

        let options = {
          width: "100%",
          height: 500,
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
    google.charts.load('51', {'packages':['table']});
    getData();
}())
