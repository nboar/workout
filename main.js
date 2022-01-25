(function () {

	// const deploymentURL = "https://script.google.com/macros/s/AKfycbwiEXyo97HTvSeBLKaORmf2rW6wVCBLihXBo0yI5okvn4XW7dP3xhF-m6lvcaH4yBI/exec";
	// const deploymentURL = "https://script.google.com/macros/s/AKfycbzaeuzG1kcvexAaXrdX_dbPdAkvCZCOSx2Ugt4V2kE/dev";

	const posterKey = "JrnkdfKi0I.3UPdk6HCno";

	//testing deployment
	// const deploymentURL = "https://script.google.com/macros/s/AKfycbwDHluNAVlFt2AaCTJDWqlxkHflm9lCs8T2bLz8Hu_duz4BudawP0n7DPNWOoXmCHTX/exec";

	//production deployment
	const deploymentURL = "https://script.google.com/macros/s/AKfycbwiEXyo97HTvSeBLKaORmf2rW6wVCBLihXBo0yI5okvn4XW7dP3xhF-m6lvcaH4yBI/exec";

    let createRepTable = function (weight, lift, sets, reps) {
        // category, weight, per side, change
        // cats: 60, 80, 90, Working
        let a60 = rnd5(.6 * weight);
        let a80 = rnd5(.8 * weight);
        let a90 = rnd5(.9 * weight);
        let table = [
            ["Percentage", "Reps", "Weight", "Per Side", "Increase"],
            ["60%", reps, a60, (a60 - 45) / 2, a60 - 45],
            ["80%", Math.round(reps / 2), a80, (a80 - 45) / 2, a80 - a60],
            ["90%", Math.round(reps / 3), a90, (a90 - 45) / 2, a90 - a80],
        ];

        for (let i = 0; i < sets; i += 1) {
        	let randID = lift + "_" + randStr();
        	let htmlB = '<div class="input-group-sm"><input name="';
        	let htmlM = '" class="form-control" value=';
        	let htmlE = "></div>"
        	let repsHTML = htmlB + randID + "_reps" + htmlM + reps + htmlE;
        	let weightHTML = htmlB + randID + "_weight" + htmlM + weight + htmlE;
        	table.push(["Work Set " + (i + 1), repsHTML, weightHTML, (weight - 45) / 2, weight - a90]);
        }

        console.log(table);

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
        fetch(deploymentURL).then(function (response) {
            return response.json();
        }).then(function (data) {
            onGet(data);
        });
    };

    let rndHalf = function (num) {
    	// rounds to nearest 0.5lbs
        return Math.round(num * 2) / 2;
    };

    let rnd5 = function (num) {
    	// rounds to only 5's 15, 25, etc
        let rnd1 = Math.round(num / 5) * 5;
        let rnd2 = Math.round((num + 2.5) / 5) * 5;
        let rnd3 = Math.round((num - 2.5) / 5) * 5;
        let ret = rnd1

        if (rnd1 / 10 === Math.round(rnd1 / 10)) {
            ret = rnd2;
        }

        if (rnd2 / 10 === Math.round(rnd2 / 10)) {
            ret = rnd3;
        }

        return ret;
    };

    let makeButton = function (text, clickFunc) {
    	let btn = $("<button>", {
    		text: text,
    		class: 'btn btn-outline-primary',
    		type: "button"
    	});

    	btn.click(clickFunc);

    	return btn;
    };

    let onGet = function (data) {
    	// only called after initial data load

    	//filter my lifts for recent data
    	data.lifts = data.lifts.map(function (row) {
            row.date = new Date(row.date);
            return row;
        }).filter(row => row.date > new Date("11/1/2021"));

        //Build options for dashboard vs lifting day
        let programObj = {};
        let liftsObj = {};
        data.program.forEach(function (lift) {
        	programObj[lift.day] = 1;
        	liftsObj[lift.movement] = 1;
        });

        let $div = $('#main');
        let $workout = $('#workout');
        let btndiv = $("<div>", {class: "btn-group"});
        let state = "";

        //dashboard view
        makeButton("Dasboard", function () {
        	$div.show();
        	$workout.hide();
        	if (state !== "Dashboard") {
        		$div.empty();	
        		state = "Dasboard";
        		Object.keys(liftsObj)
	        		.forEach(lift => buildDashboardElement(data, lift));
        	}
        }).appendTo(btndiv);

        // workout views
        Object.keys(programObj).forEach(function (day) {
        	makeButton('Day ' + day, function () {
        		$div.show();
	        	$workout.hide();

        		if (state !== 'Day ' + day) {
	        		$div.empty();	
	        		state = 'Day ' + day;
	        		let thisProgram = data.program.filter(a => a.day === day)
	        		thisProgram.forEach(lift => buildDashboardElement(data, lift.movement));
	        		addWorkoutButton(data, thisProgram);
	        	}
        	}).appendTo(btndiv);

        });
        btndiv.appendTo($("#navigation"));
    };

    let addWorkoutButton = function (data, program) {
    	let $main = $('#main');
    	let $workout = $('#workout');

    	//setting this up so multiple submits cannot happen
    	let posted = false;
    	let postData = function (data) {
			post(data).catch(function (err) {
				console.error(err);
				$submitBtn.removeClass("btn-primary");
				$submitBtn.addClass("btn-danger");
				$submitBtn.text("Failed, try again...");
				posted = false;
			}).then(function (res) {
				$('main').children().empty();
				$('#workout')
					.show()
					.html('<div class="jumbotron jumbotron-fluid"><div class="container"><h2 class="display-4">Success!</h2><p class="lead">Submitted, loading data, once done, select a button above to continue.</p></div></div>');
				getData();
			});
		};

    	let $submitBtn = $('<button>', {
			text: "Submit Workout",
			class: "btn btn-primary",
			style: 'margin-bottom: 20px; margin-top: 20px'
		});

    	$('<button>', {
    		text: "Start Workout",
    		class: 'btn btn-success',
    		style: 'margin-bottom: 20px'
    	}).click(function () {
    		let moves = [];
    		let inputs = $main.find("input");
    		$workout.empty();
    		$main.hide();
    		$workout.show();

    		inputs.each(function (ind) {
    			buildWorkout({
    				name: inputs[ind].name,
    				weight: inputs[ind].value,
    				program: program.filter(a => a.movement === inputs[ind].name)[0]
    			}, $workout);
    		});

    		$submitBtn.click(function (evt) {
    			evt.preventDefault();
    			let formList = $workout.serializeArray();

    			//assign movement, reps, and weight per uid
    			let formEntries = {};
    			formList.forEach(function (input) {
    				let name = input.name.split('_');
    				formEntries[name[1]] = formEntries[name[1]] || {};
    				formEntries[name[1]].movement = name[0];
    				formEntries[name[1]][name[2]] = input.value;
    			});

    			// transform into a table
    			let submitTable = Object.keys(formEntries).map(function (key) {
    				//format in table is: movement;weight;date;difficulty;sets;repetitions
    				return [
    					formEntries[key].movement,
    					formEntries[key].weight,
    					(new Date()).toLocaleDateString(),
    					0, // difficulty
    					1, // sets
    					formEntries[key].reps
    				];
    			});
    			
    			//actually post the data
    			if (!posted) {
    				postData(submitTable);
    				posted = true;
    			}

    		}).appendTo($workout);

    	}).appendTo($main);
    };

    let buildWorkout = function (move, $div) {
    	$("<h2>", {text: move.name}).appendTo($div);
    	$("<p>", {
    		text: move.weight + " lbs for " + move.program.sets + " sets of " + move.program.repetitions + " repetitions."
    	}).appendTo($div);

    	//Add the framework for the worktable
    	let $tableDiv = $("<div>").appendTo($div);
    	let $workTable = $(createBootTable(createRepTable(move.weight, move.name, move.program.sets, move.program.repetitions)));
    	$workTable.appendTo($tableDiv)

    	// Add the "add a row button"
    	$('<button>', {
    		type: "button",
    		class: "btn btn-outline-info",
    		text: "Add Row"
    	}).click(function (evt) {
    		evt.preventDefault();
    		console.log('adding to');
			let $body = $workTable.children('tbody');
			let html = $body.children(":last")[0].outerHTML;
			let number = html.match(/Work Set (\d+)/)[1] * 1 + 1;
			html = html.replace(/Work Set (\d+)/, "Work Set " + number);
			html = html.replace(/_\d+_/g, "_" + randStr() + "_");
			$(html).appendTo($body);
    	})
    	.appendTo($div);

    };

    let randStr = function () {
    	// builds random string for ID.
        return Math.random().toString().replace(/0\./, "");
    };

    let addComponents = function ($div, identifier, divName) {
    	// add header
    	$('<h2>', {
    		text: identifier
    	}).appendTo($div);

    	// add figure column
    	$('<div>', {
    		class: "col-md-12 col-lg-6",
    		id: divName
    	}).appendTo($div);

    	// Add data column
    	let $column2 = $('<div>', {
    		class: "col-md-12 col-lg-6"
    	}).appendTo($div);

    	// add horizontal line
    	$('<hr>').appendTo($div);

    	//add all data regions, and return an object
    	return {
    		nextTable: $('<p>').appendTo($column2),
    		info: $('<p>').appendTo($column2),
    		goalProject: $('<p>').appendTo($column2),
    		workoutAmt: $('<p>').appendTo($column2),
    		workout: $('<p>').appendTo($column2)
    	};
    };

    let summarizeData = function (dataObj, identifier) {
    	let data = dataObj.lifts;
        let byDateData = {};
        let summaryData = [];

        //filter and break up by date
        data
            .filter(a => a.movement === identifier)
            .forEach(function (lift) {
                byDateData[lift.date.toDateString()] =
                    byDateData[lift.date.toDateString()] || [];
                byDateData[lift.date.toDateString()].push(lift);
            });

        // broken up by date now pull info per day
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
            summaryData.push({
                date: new Date(date),
                difficulty: difficulty,
                work: totalWork,
                oneRM: oneRepMax,
                maxRep: maxAttempt,
                lifts: byDateData[date],
                counts: Object.keys(totalByWeight)
                    .map(key => [key, totalByWeight[key]])
            });
        });
        return summaryData;
    }

    let getGoal = function (goals, last) {
    	let thisGoal = goals[0];
        let goalIndex = 0;

        while (last.oneRM >= thisGoal["weight (1RM)"] && goalIndex < goals.length - 1) {
            goalIndex += 1;
            thisGoal = goals[goalIndex];
        }

        return thisGoal;
    };

    let buildDashboardElement = function (dataObj, identifier) {
    	let data = dataObj.lifts;
        let goals = dataObj.goals
            .filter(a => a.movement === identifier)
            .map(function (goal) {
                goal.date = new Date(goal.date);
                return goal;
            })
            .sort((a, b) => a.date - b.date);
        let program = dataObj.program.filter(a => a.movement === identifier);
        let divName = identifier.toLowerCase().replace(/\s/, "_");

      	// add components
      	let $div = $("#main");
      	let page = addComponents($div, identifier, divName);

        // summarize data by date
        let summaryData = summarizeData(dataObj, identifier);

        // get last lift as well as rep/set setup
        let last = summaryData.sort((a, b) => b.date - a.date)[0];
        let reps = program[0].repetitions;
        let sets = program[0].sets;

        // define current goal
        let goalObj = getGoal(goals, last); // already filtered by identifier
        let goalRep = calculateReps(goalObj["weight (1RM)"], 1, reps);

        // create figure
        buildFigure(summaryData, divName);

        // display goals and last
        page.info.html(
            "<p><b>Last:</b> " + last.counts.sort((a, b) => b[0] - a[0]).map(a => a[0] + " lbs x " + a[1] + " reps").join(', ') +
            " (1RM: " + last.oneRM + " lbs)" +
            "</p>" +
            "<p><b>Goal (" + goalObj.date.toLocaleDateString("en-US") + "):</b> " +
            goalRep + " lbs " + reps + "RM" +
            " (" + goalObj["weight (1RM)"] + " lbs 1RM)</p>"
        );

        // calculate needed growth
        let toGoal = (goalObj["weight (1RM)"] - last.oneRM) / goalObj["weight (1RM)"];
        let workOutsToTotal = Math.floor((goalObj.date - last.date) / 1000 / 60 / 60 / 24 / program[0].cycleLength);

        // Display needed growth
        page.goalProject.html(Math.ceil(toGoal / workOutsToTotal * 1000) / 10 + "% increase needed in each of " + workOutsToTotal + " sessions to reach goal.");

        //create table for next lift
        let equalReps = calculateReps(last.oneRM, 1, reps);
        let equalWork = rndHalf(last.work / (sets * reps));
        let nextTable = [
            ["Metric", "Equivalent (lbs)", "+1.5% (lbs)", "+3% (lbs)", "+4.5% (lbs)"],
            [
                reps + "-rep",
                equalReps,
                rndHalf(equalReps + goalRep * 0.015),
                rndHalf(equalReps + goalRep * 0.03),
                rndHalf(equalReps + goalRep * 0.045)
            ],
            [
                "Work (" + (sets * reps) + " reps)",
                equalWork,
                rndHalf(equalWork + goalRep * 0.015),
                rndHalf(equalWork + goalRep * 0.03),
                rndHalf(equalWork + goalRep * 0.045)
            ]
        ];

      //   nextTable: $('<p>').appendTo($column2),
    		// info: $('<p>').appendTo($column2),
    		// goalProject: $('<p>').appendTo($column2),
    		// workoutAmt: $('<p>').appendTo($column2),
    		// workout: $('<p>').appendTo($column2)

        //display next lifts table
        page.nextTable.html(createBootTable(nextTable));

        // build next weight area
        let weightid = "weight" + randStr();

        // add the elements
        $workoutWeight = $('<input>', {
        	class: "form-control",
        	name: identifier,
        	id: weightid,
        	value: equalReps
        });
        $('<div>', {class: "mb-3"})
        	.append($('<label>', {
        		class: "form-label",
        		for: weightid,
        		html: "<b>Work Set Weight</b>"
        	}))
        	.append($workoutWeight)
        	.appendTo(page.workoutAmt);
    }

    let buildFigure = function (summaryData, divName) {

        let figData = [
            ["Date", "1RM (Calc)", "Work", "Max Rep"]
        ];
        summaryData.forEach(a => figData.push([
        	a.date,
        	a.oneRM,
        	a.work,
			a.maxRep
        ]));

        let buildIt = function () {
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
                    0: {
                        targetAxisIndex: 0
                    },
                    1: {
                        targetAxisIndex: 1
                    },
                    2: {
                        targetAxisIndex: 0
                    },
                },
                vAxes: {
                    0: {
                        title: 'Calculated Weight 1RM (lbs)'
                    },
                    1: {
                        title: 'Work total (lbs)'
                    }
                }
            };

            let wrap = new google.visualization.ChartWrapper({
                chartType: 'LineChart',
                dataTable: visData,
                options: options,
                containerId: divName,
            });

            wrap.draw();
        };

        google.charts.setOnLoadCallback(buildIt);
    };

    let post = function (data) {
    	let postObj = {
    		data: data,
    		key: posterKey
    	};

		return fetch(deploymentURL, { 
			method: "POST",
	  		body: JSON.stringify(postObj) 
	  	}).then((response) => {
	  		console.log(response.status);
	  		if (response.status !== 200) {
	  			throw "Did not work";
	  		}
			return response.json();
	    }).then((res) => {
	    	console.log(res);
	    	if (res && res.success) {
	    		return res;
	    	}
	    	throw "Did not work";
	    });
	}

    //actually get things started
    google.charts.load('51', {
        'packages': ['table']
    });
    getData();
}())
