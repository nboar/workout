let GLOBAL;
(function () {

	const posterKey = "JrnkdfKi0I.3UPdk6HCno";
	const weightPosterKey = "7vMb8qY2vW.Pd48e4unuE";
	const startDate = new Date("3/12/2021");
	const oneRMKey = "weight (1RM)";
	const BAR_W = 45;
	const PROJECT_TIME = 45; // days projected forward
	const ONE_DAY =   1000 * 60 * 60 * 24;
	const PER_INC = [1.5, 3, 4.5]; // for percent growth of movements
	const pers = [ // weight ratio to 1RM 
        100, // 1RM
        94, // 2RM
        91, // 3RM
        88, // 4RM
        86, // 5RM
        83, // 6RM
        82, // 7RM
        78, // 8RM
        77, // 9RM
        73 // 10RM
    ];

	//testing deployment
	// const deploymentURL = "https://script.google.com/macros/s/AKfycbwDHluNAVlFt2AaCTJDWqlxkHflm9lCs8T2bLz8Hu_duz4BudawP0n7DPNWOoXmCHTX/exec";

	//production deployment
	const deploymentURL = "https://script.google.com/macros/s/AKfycbwiEXyo97HTvSeBLKaORmf2rW6wVCBLihXBo0yI5okvn4XW7dP3xhF-m6lvcaH4yBI/exec";

	///////////////////////////////////////
	// general purpose functions
	///////////////////////////////////////
	const clone = (function () {
		// taken from https://javascript.plainenglish.io/write-a-better-deep-clone-function-in-javascript-d0e798e5f550

		function cloneOtherType(target) {
		    const constrFun = target.constructor;
		    switch (toRawType(target)) {
		        case "Boolean":
		        case "Number":
		        case "String":
		        case "Error":
		        case "Date":
		            return new constrFun(target);
		        case "RegExp":
		            return cloneReg(target);
		        case "Symbol":
		            return cloneSymbol(target);
		        case "Function":
		            return target;
		        default:
		            return null;
		    }
		}

		function toRawType (value) {
		  let _toString = Object.prototype.toString;
		  let str = _toString.call(value)
		  return str.slice(8, -1)
		}

		function cloneSymbol(targe) {
			//extra line for collapse
		    return Object(Symbol.prototype.valueOf.call(targe));
		}

		function cloneReg(targe) {
		    const reFlags = /\w*$/;
		    const result = new targe.constructor(targe.source, reFlags.exec(targe));
		    result.lastIndex = targe.lastIndex;
		    return result;
		}

		function forEach(array, iteratee) {
		    let index = -1;
		    const length = array.length;
		    while (++index < length) {
		        iteratee(array[index], index);
		    }
		    return array;
		}

		// core function
		return function (target, map = new WeakMap()) {

		    // clone primitive types
		    if (typeof target != "object" || target == null) {
		        return target;
		    }

		    const type = toRawType(target);
		    let cloneTarget = null;

		    if (map.get(target)) {
		        return map.get(target);
		    }
		    map.set(target, cloneTarget);

		    if (type != "Set" && type != "Map" && type != "Array" && type != "Object") {
		        return cloneOtherType(target)
		    }

		    // clone Set
		    if (type == "Set") {
		        cloneTarget = new Set();
		        target.forEach(value => {
		            cloneTarget.add(clone(value, map));
		        });
		        return cloneTarget;
		    }

		    // clone Map
		    if (type == "Map") {
		        cloneTarget = new Map();
		        target.forEach((value, key) => {
		            cloneTarget.set(key, clone(value, map));
		        });
		        return cloneTarget;
		    }

		    // clone Array
		    if (type == "Array") {
		        cloneTarget = new Array();
		        forEach(target, (value, index) => {
		          cloneTarget[index] = clone(value, map);
		        })
		    }

		    // clone normal Object
		    if (type == "Object") {
		        cloneTarget = new Object();
		        forEach(Object.keys(target), (key, index) => {
		          cloneTarget[key] = clone(target[key], map);
		        })
		    }

		    return cloneTarget;
		}
	}());
	const randStr = function () {
    	// builds random string for ID.
        return Math.random().toString().replace(/0\./, "");
    };

	///////////////////////////////////////
	// specific calculation functions
	///////////////////////////////////////
	const calculateReps = function (weight, repin, repout) {
		// simple calculation based on pers table above
        return rndHalf(weight / pers[repin - 1] * pers[repout - 1]);
    };
	const rndHalf = function (num) {
    	// rounds to nearest 0.5lbs
        return Math.round(num * 2) / 2;
    };
    const rnd5 = function (num) {
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
    const rndQuart = function (num) {
    	// rounds to nearest 0.25lbs
        return Math.round(num * 4) / 4;
    }

    ///////////////////////////////////////
	// scope in the buildDataObject functions
	///////////////////////////////////////
	const buildDataObject = (function () {
		let lastGoalDate = new Date(new Date() * 1 + PROJECT_TIME * ONE_DAY);

		const findProgramDays = function (dataArr) {
	    	let outObj = {};
	    	dataArr.forEach(function (lift) {
	    		if (lift.wkday) {
	    			outObj[lift.wkday] = outObj[lift.wkday] || {};
	    			outObj[lift.wkday][lift.date] = outObj[lift.wkday][lift.date] || [];
	    			outObj[lift.wkday][lift.date].push(lift);
	    		} else {
	    			outObj["none"] = outObj["none"] || {};
	    			outObj["none"][lift.date] = outObj["none"][lift.date] || [];
	    			outObj["none"][lift.date].push(lift);
	    		}
	    	});
	    	Object.keys(outObj)
	    		.forEach(function (day) {
	    			outObj[day] = Object.keys(outObj[day])
	    				.map(function (date) {
	    					let ret = {
	    						date: new Date(date),
		    					lifts: outObj[day][date]
	    					};
	    					if (day !== "none") {
	    						ret.day = day;
	    					}
	    					return ret;
	    				})
	    				.sort((a, b) => b.date - a.date);
	    		});
	    	return outObj;
	    };

		const flushOutPrograms = function (data) {
			// define color list
			let colorList = [
	    		"#6610f2",
	    		"#fd7e14",
	    		"#198754",
	    		"#0dcaf0",
	    		"#d63384",
	    		"#ffc107",
	    		"#dc3545"
	    	];
			
		    // flush out day information
	        let programObj = {};
	        data.program = data.program.map(function (lift) {
	        	let last = data.lifts
	    			.filter(a => a.day === lift.day)
	    			.sort((a, b) => b.date - a.date)[0].date;
	        	programObj[lift.day] = programObj[lift.day] || {
	        		color: colorList.shift(),
	        		day: lift.day,
	        		last: last,
	        		cycleLength: lift.cycleLength,
	        		movements: []
	        	};
	        	programObj[lift.day].movements.push(lift);
	        	lift.color = programObj[lift.day].color;
	        	lift.last = last;
	        	return lift;
	        });

	        return programObj;
		};

		const summarizedByDate = function (dateObj) {
			// summarized each lift/date combination
			let retArr = [];
			let dateStrs = Object.keys(dateObj);

			return dateStrs.map(function (date) {
				let oneRepMax = 0;
	            let maxAttempt = 0;
	            let totalWork = 0;
	            let totalByWeight = {};
	            let difficulty;
	            let day;
	            dateObj[date].forEach(function (lift) {
	            	// determine oneRepMax
	            	let thisRep = calculateReps(lift.weight, lift.repetitions, 1);
	                oneRepMax = Math.max(oneRepMax, thisRep);

	                // grab max lift completed
	                maxAttempt = Math.max(maxAttempt, lift.weight);

	                //calculate total work
	                totalWork += lift.weight * lift.repetitions * lift.sets;

	                //assign 'difficulty'
	                difficulty = lift.difficulty;

	                //assign 'day'
	                day = lift.day
	            });
	            return {
	                date: new Date(date),
	                difficulty: difficulty,
	                work: totalWork,
	                oneRM: oneRepMax,
	                maxRep: maxAttempt,
	                lifts: dateObj[date],
	                day: day
	            };
			}).sort((a, b) => b.date - a.date); // order by new first
		};

		const getMovementInformation = function (data) {
			// Pull the data together by movement
			let movementObj = {};

			//start the process with lift days
			data.lifts.forEach(function (lift) {
				let liftDate = lift.date.toLocaleDateString();

				//define object
				movementObj[lift.movement] = movementObj[lift.movement] || {
					movement: lift.movement,
					goals: data.goals.filter(a => a.movement === lift.movement),
					days: data.program.filter(a => a.movement === lift.movement),
					lifts: [],
					liftsByDate: {}
				};

				//add lift
				movementObj[lift.movement].lifts.push(lift);

				//add lift by date
				movementObj[lift.movement].liftsByDate[liftDate] = movementObj[lift.movement].liftsByDate[liftDate] || [];
				movementObj[lift.movement].liftsByDate[liftDate].push(lift); 
			});

			// clean up lifts by date and add summary data
			Object.keys(movementObj)
				.forEach(function (move) {
					movementObj[move].liftsByDate = summarizedByDate(movementObj[move].liftsByDate);
				});

			return movementObj;
		};

		const getFilters = function (getObj, days, movements) {
			let daysRet = days, movementsRet = movements;

			// grab all days of interest
			if (getObj.day) {
				daysRet = getObj.day.split(';').map(a => a.trim());
			}

			//grab all movements of interest
			if (getObj.movement) {
				movementsRet = getObj.movement.split(';').map(a => a.trim());
			}

			return {
				days: daysRet,
				movements: movementsRet
			};
		};

		const projectForward = function (daysObj, days) {
			//Create 1 month projection of events
	        let today = new Date();
	    	let dayMult = 1000 * 60 * 60 * 24;
	    	today = new Date(today.toLocaleDateString()) * 1; // clear time	    	

	    	let lastDays = Object.keys(daysObj)
	    		.map(day => { return {
	    			date: daysObj[day].last,
	    			day: day,
	    			length: daysObj[day].cycleLength
	    		}})
	    		.sort((a, b) => a.date - b.date);

	    	let nextInd = 0;
	    	let shiftLength = lastDays.length;
	    	let nextDay = clone(lastDays[nextInd].date);
	    	while (nextDay * 1 <= lastGoalDate * 1) {
	    		nextDay = clone(lastDays[nextInd].date) * 1 + lastDays[nextInd].length * ONE_DAY;
	    		while (nextDay < today) {
        			nextDay = nextDay * 1 + ONE_DAY;
        		}
        		while (nextDay * 1 <= lastDays[lastDays.length - 1].date * 1) {
        			nextDay = nextDay * 1 + ONE_DAY;
        		}
        		lastDays.push({
        			date: new Date(nextDay),
        			day: lastDays[nextInd].day,
        			length: lastDays[nextInd].length,
        		});
        		if (nextInd < shiftLength) {
        			shiftLength -= 1;
        			nextInd -= 1;
        			lastDays.shift();
        		}
        		nextInd += 1;
	    	}

	    	// assign the list
	    	Object.keys(daysObj)
	    		.forEach(function (day) {
	    			daysObj[day].future = lastDays
	    				.filter(tmpDayObj => tmpDayObj.day === day)
	    				.map(tmpDayObj => tmpDayObj.date)
	    		});

	    	// assign this list to the origin days array so it will end up in movements etc
	    	days.forEach(function (dayObj) {
	    		dayObj.future = daysObj[dayObj.day].future;
	    	});
		};

		const calculateGoalProgress = function (movement) {
			// movement.days will be attached with goal progress

			movement.days.forEach(function (dayObj) {
				let progObj = {
					oneRM: 0,
					completeWorkoutWeight: 0
				};
				movement.liftsByDate.forEach(function (date) {
					// One Rep Max
					progObj.oneRM = Math.max(
						progObj.oneRM,
						date.oneRM
					);

					// Completed workout
					let completeSetCount = 0;
					let weightsLifted = [];
					date.lifts.forEach(function (lift) {
						if (lift.repetitions >= dayObj.repetitions) {
							for (let i = 0; i < lift.sets; i += 1) {
								weightsLifted.push(lift.weight);
							}
						}
					});

					if (weightsLifted.length >= dayObj.sets) {
						//sort weights lifted
						weightsLifted.sort((a, b) => b - a);

						//grab worst set that hit reps and counted
						progObj.completeWorkoutWeight = Math.max(
							weightsLifted[dayObj.sets - 1],
							progObj.completeWorkoutWeight
						);
					}
				});

				//Assign object
				dayObj.progress = progObj;
			});
		};

		// buildDataObject function
		return function (data) {
			//terminology: 
				// lift: actual lift session
				// movement: description of the lift ie back squat
				// day: day of workout, as in day A, B, C, D
				// date: calendar date of workout

			console.log("dataObjIn", data);

			let retObj = {};

			retObj.get = {};

			retObj.get.weight = function () {
				return data.weight;
			}

			retObj.get.movement = function (getObj) {
				// filter options: Workout day, Movement
				getObj = getObj || {};
				
				let filterObj = getFilters(getObj, days, movements);

				let retArr = [];

				filterObj.movements.forEach(function (move) {
					let daysForMove = movementObj[move].days;
					let matched = false;
					let index = 0;
					if (daysForMove.length === 0) {
						matched = true; // allow retired lifts to show up
					}
					while (!matched && index < daysForMove.length) {
						let searchRes = filterObj.days.filter(a => daysForMove[index].day);
						if (searchRes.length > 0) {
							matched = true;
						}
					}

					if (matched) {
						retArr.push(clone(movementObj[move]));
					}
				});

				return retArr;
			};

			retObj.get.days = function (getObj) {
				// filter options: Workout day, Movement
				getObj = getObj || {};
				
				let filterObj = getFilters(getObj, days, movements);

				let retArr = [];

				filterObj.days.forEach(function (day) {
					let moveArr = daysObj[day].movements
						.filter(move => filterObj.movements.includes(move.movement));

					if (moveArr.length) {
						let addObj = clone(daysObj[day]);
						moveArr = clone(moveArr).map(function (move) {
							move.movementObj = retObj.get.movement({day: day, movement: move.movement})[0];
							//move.movementObj.days = move.movementObj.days.filter(dayObj => dayObj.day === day);
							return move;
						})
						addObj.movements = moveArr;
						retArr.push(addObj);
					}
				});

				return retArr;
			};

			retObj.get.dates = function (getObj) {
				let dates = {};
				data.lifts.forEach(function (lift) {
					let dtString = lift.date.toLocaleDateString("en-us");
					dates[dtString] = dates[dtString] || {
						date: lift.date,
						day: daysObj[lift.day],
						lifts: []
					}
					dates[dtString].lifts.push(lift);
				});
				days.forEach(function (day) {
					daysObj[day].future.forEach(function (date) {
						let dtString = date.toLocaleDateString("en-us");
						dates[dtString] = dates[dtString] || {
							date: date,
							day: daysObj[day],
							lifts: []
						};
					});
				});

				return clone(Object.keys(dates).map(d => dates[d]));
			};

	    	// filter my lifts for recent data 
	    	// make date objects
	    	// add 1RM calculation
	    	data.lifts = data.lifts.map(function (row) {
	            row.date = new Date(row.date);
	            row.oneRM = calculateReps(row.weight, row.repetitions, 1);
	            return row;
	        }).filter(row => row.date > startDate);

	        //turn goal dates into date objects
	        data.goals = data.goals.map(function (row) {
	        	row.date = new Date(row.date);
	        	lastGoalDate = new Date(Math.max(row.date * 1, lastGoalDate * 1));
	        	return row;
	        });

	    	// flush out program obj and rewrite data.program to include colors
	        let daysObj = flushOutPrograms(data);
	        let days = Object.keys(daysObj);

	        // project forward workout dates
	        projectForward(daysObj, data.program);

	        // flush out movement information
	        let movementObj = getMovementInformation(data, daysObj);
	        let movements = Object.keys(movementObj);

	        // finally determine goal progress on the movementObj and project forward
	        movements.forEach(move => calculateGoalProgress(movementObj[move]));
	        // console.log(clone(movementObj));

	        console.log(data, daysObj, movementObj);

	        return retObj;

	        //pull out by workout day (when avaliable)
	        // let programDays = findProgramDays(data.lifts);

	        // add in day information to workout days
	        // Object.keys(programDays).forEach(function (day) {
	        // 	programDays[day].day = programObj[day];
	        // });
	        // console.log(programDays);
		};
	}());

	let makeCheck = function () {
		let randomID = randStr();
        let $check = $('<span>', {
        	class: 'workout-check'
        });
        let $checkbox = $('<input>', {
        	type: "checkbox",
        	class: "btn-check",
        	id: randomID,
        	value: "off",
        	autocomplete: "off"
        }).appendTo($check).click(function (evt) {
        	evt.preventDefault();
        	if ($checkbox.val() === "on") {
        		$checkbox.val("off");
        		$check.parent().parent().find('.form-control').attr('readonly', false);
        		$check.parent().parent().css('background-color','transparent');
        		$checkLabel.addClass("btn-outline-warning");
        		$checkLabel.removeClass("btn-success");
        		$checkLabel.html('<span class="material-icons align-middle">radio_button_unchecked</span>');
        		
        	} else {
        		$checkbox.val("on");
        		$check.parent().parent().find('.form-control').attr('readonly', true);
        		$check.parent().parent().css('background-color','#e9fbf3');
				$checkLabel.removeClass("btn-outline-warning");
        		$checkLabel.addClass("btn-success");
        		$checkLabel.html('<span class="material-icons align-middle">check_circle</span>');
        	}
        	console.log($checkbox.val());
        });
        let $checkLabel = $('<label>', {
        	class: "btn btn-sm btn-outline-warning",
        	for: randomID,
        	html: '<span class="material-icons align-middle">radio_button_unchecked</span>'
        }).appendTo($check);

        return $check;
	};

    let createRepTable = function (weight, lift, sets, reps, $totalWork) {
        // category, weight, per side, change
        // cats: 60, 80, 90, Working
        let makeRow = function () {
        	let randID = lift + "_" + randStr();
        	let $rep = $('<input>', {
        		inputmode: "numeric",
        		class: "form-control repCount",
        		type: "number",
        		step: "1",
        		name: randID + "_reps",
        		value: reps
        	}).change(updateTotalWork);
        	repsArr.push($rep)

        	let $weight = $('<input>', {
        		inputmode: "decimal",
        		step: "0.5",
        		class: "form-control weightAmount",
        		type: "number",
        		name: randID + "_weight",
        		value: weight
        	}).change(function () {
        		$weight.val(rndHalf($weight.val()));
        	}).change(updateTotalWork)
        	.change(function () {
        		$perSide.text(rndQuart(($weight.val() - BAR_W) / 2));
        	});
        	weightsArr.push($weight);

        	let $perSide = $('<span>', {
        		text: ps4
        	});

        	workSetIndex += 1;

        	return [
        		"WS " + (workSetIndex),
        		$('<div>', {
	        		class: "input-group-sm"
	        	}).append($rep),
        		$('<div>', {
	        		class: "input-group-sm"
	        	}).append($weight),
        		$perSide,
        		makeCheck()
        	];
        };

        let updateTotalWork = function () {
        	let reps = $table.find('.repCount');
        	let weights = $table.find('.weightAmount');
        	let work = 0;
        	
        	reps.each(function (ind, rep) {
        		work += $(rep).val() * $(weights[ind]).val();
        	});

        	$totalWork.text(work);
        	
        };

        let a60 = rnd5(.6 * weight);
        let a80 = rnd5(.8 * weight);
        let a90 = rnd5(.9 * weight);
        let d1 = a80 - a60;
        let d2 = a90 - a80;
        let d3 = weight - a90;

        let ps1 = (a60 - BAR_W) / 2;
        let ps2 = (a80 - BAR_W) / 2;
        let ps3 = (a90 - BAR_W) / 2;
        let ps4 = (weight - BAR_W) / 2;

        let dd1 = ps2 - ps1;
        let dd2 = ps3 - ps2;
        let dd3 = ps4 - ps3;

        let dHTMLB = '<p class="lh-1 text-decoration-underline" style=" margin: 0px; font-size:small">(+';
        let dHTMLE = ')</p>';

        let table = [
            ["Set", "Reps", "Weight", "Per Side", "Done"],
            ["WU: 60%", reps, a60 + dHTMLB + d1 + dHTMLE, ps1 + dHTMLB + dd1 + dHTMLE, makeCheck()],
            ["WU: 80%", Math.round(reps / 2), a80 + dHTMLB + d2 + dHTMLE, ps2 + dHTMLB + dd2 + dHTMLE, makeCheck()],
            ["WU: 90%", Math.round(reps / 3), a90 + dHTMLB + d3 + dHTMLE, ps3 + dHTMLB + dd3 + dHTMLE, makeCheck()]
        ];

        let repsArr = [];
        let weightsArr = [];
        let workSetIndex = 0;

        for (i = 0; i < sets; i += 1) {
        	table.push(makeRow());
        }

        let $table = createBootTable(table);

        let addRowFunc = function () {
        	let $tableBody = $($table.children('tbody'));
        	
        	//update the last weight
        	weight = $tableBody.children(':last').find('.weightAmount').val();
        	ps4 = (weight - BAR_W) / 2;

        	//add the row
        	let $tr = $('<tr>').appendTo($tableBody);
        	let tableArr = makeRow();
        	createBootRow(tableArr, '<td>', $tr);

        	//update the work
        	updateTotalWork();
        };



        return {
        	table: $table,
        	addRow: addRowFunc
        };
    };

    let createBootRow = function (arr, tdStr, $tr) {
    	return arr.forEach(function (entry) {
        	if (typeof entry === "string" || typeof entry === "number" || !entry) {
        		$(tdStr).html(entry).appendTo($tr);
        	} else {
        		$(tdStr).append(entry).appendTo($tr);
        	}
        });
    };

    let createBootTable = function (arr) {
        let retObj = {};
        let randomID = randStr();

        let $adder;
        let $table = $('<table>', {
        	class: "table table-sm"
        });

        let htmlString = "";
        htmlString += '<table class="table table-sm">';
        arr.forEach(function (row, j) {
        	let tdInit = '<td>';
            if (j === 0) {
            	$adder = $('<thead>').appendTo($table);
            	let tdInit = '<th>';
            } else if (j === 1) {
            	$adder = $('<tbody>').appendTo($table);
            }

            let $tr = $('<tr>').appendTo($adder);
            createBootRow(row, tdInit, $tr);
        });

        return $table;
    };

    let getData = function () {
        fetch(deploymentURL).then(function (response) {
            return response.json();
        }).then(function (data) {
            onGet(data);
        });
    };

    let addCalendar = function (dates, $div) {
    	let html = 
			'<div id="app">' +
			"<v-calendar is-expanded :attributes='attrs'></v-calendar>" +
			"</div>";

		$div.append($(html));

		let todayString = (new Date()).toLocaleDateString();

		let today = {
			key: 'today',
			dates: new Date(),
			highlight: {
				fillMode: 'solid',
				style: {
					"background-color": 'blue'
				}
			}
		};

		let events = createCalendarEvents(dates);

		let eventsArr = events.map(function (colorScheme) {
			let ret = JSON.parse(JSON.stringify(colorScheme));

			//determine length
			let datesLen = ret.dates.length;

			//filter looking for today
			ret.dates = ret.dates
				.map(a => new Date(a))
				.filter(a => a.toLocaleDateString() !== todayString);

			//if found today then change today options
			if (ret.dates.length !== datesLen) {
				today.highlight.style = JSON.parse(JSON.stringify(colorScheme.highlight.style));
				today.highlight.style["background-color"] = today.highlight.style["border-color"];
				today.popover = JSON.parse(JSON.stringify(colorScheme.popover));
			}

			return ret;
		});

		eventsArr.push(today);

		new Vue({
			el: '#app',
			data: {
				selectedDate: null,
				attrs: eventsArr
			}
		});
    }

    let makeButton = function (text, clickFunc, decor) {
    	decor = decor || ""
    	let btn = $("<button>", {
    		text: text,
    		style: decor,
    		class: 'btn btn-outline-primary',
    		type: "button"
    	});

    	btn.click(clickFunc);

    	return btn;
    };

    let createCalendarEvents = function (dates) {
    	let eventsObj = {};
    	let makeEventObj = function (date) {
    		eventsObj[date.day.day] = eventsObj[date.day.day] || {
				key: 'day' + date.day.day,
				cycleLength: date.day.cycleLength,
				dates: [],
				highlight: {
					fillMode: "outline",
					style: {
						"border-color": date.day.color
					}
				},
        		popover: {
        			hideIndicator: true,
        			label: "Day " + date.day.day + ": " + date.day.movements.map(a => a.movement).join(', ')
        		}
			};
			eventsObj[date.day.day].dates.push(date.date);
    	};

    	
    	const cutoff = new Date("1/1/22");
		dates.filter(date => date.date > cutoff).forEach(makeEventObj);
		
		let events = Object.keys(eventsObj).map(day => eventsObj[day]);

		return events;
    };

    let makeWeight = function (weight) {

    	// for posting the weight
    	let posted = false;
    	let postData = function (data) {
			post(data, weightPosterKey).then(function (res) {
				console.log("posted?", res);
				$('main').children().empty();
				$('#workout')
					.show()
					.html('<div class="jumbotron jumbotron-fluid"><div class="container"><h2 class="display-4">Success!</h2><p class="lead">Submitted, loading data, once done, select a button above to continue.</p></div></div>');
				getData();
			}).catch(function (err) {
				console.error(err);
				$button.removeClass("btn-outline-primary");
				$button.attr("disabled", false);
				$button.addClass("btn-outline-danger");
				$button.text("Failed, try again...");
				posted = false;
			});
		};


    	let $ret = $('<div>', {
    		class: "row text-center h-100"
    	});

    	$('<h5>', {
    		text: 'Current Weight'
    	}).appendTo($ret);

    	let $inpHold = $('<form>', {
    		class: "align-middle"
    	}).appendTo($ret);

    	let $inputGrp = $('<span>', {
    		id: "weightForm",
    		class: "input-group mb-3",
    	}).appendTo($inpHold);

    	let $input = $('<input>', {
    		type: "number",
    		step: "0.1",
    		inputmode: "decimal",
    		class: "form-control",
    		value: weight
    	}).appendTo($inputGrp);

    	$('<span>', {
    		class: "input-group-text",
    		text: "lbs"
    	}).appendTo($inputGrp);

    	let $inputGrp2 = $('<span>', {
    		id: "w-100 weightForm",
    		class: "input-group mb-3"
    	}).appendTo($inpHold);

    	let $button = $('<button>', {
    		class: "w-100 btn btn-outline-primary",
    		type: "submit",
    		value: "Submit",
    		text: "Update"
    	}).click(function (evt) {
    		evt.preventDefault();
    		if (!posted) {
    			posted = true;
    			$button.text("Updating ...");
    			$button.attr("disabled", true);
    			postData($input.val() * 1);
    		}
    	}).appendTo($inputGrp2);

    	return $ret;
    };

    let onGet = function (data) {
    	// function called on initial load and following submit

    	// build object to interact with data
    	const myDataObj = buildDataObject(data);

    	//identify main areas of page
    	let $navigation = $("#navigation")
        let $div = $('#main');
        let $workout = $('#workout');

        // empty for replays
        $navigation.empty();
		$div.empty();
		$workout.empty();

        //define button div, and append to navigation tab
        let btndiv = $("<div>", {class: "btn-group"});
        btndiv.appendTo($navigation);

        // set state variable
        let state = "";

        let byDay = myDataObj.get.days();

        //dashboard view
        let $dashBtn = makeButton("Dasboard", function () {
        	$div.show();
        	$workout.hide();
        	if (state !== "Dashboard") {
        		$div.empty();	
        		state = "Dasboard";

        		let $hold = $('<div>', {
        			class: "row",
        		}).appendTo($("<div>", {
        			class: "container"
        		}).appendTo($div));

        		//add the calendar
        		let $cal = $('<div>', {
        			class: "col-xs-12 col-sm-9",
        			style: "margin-bottom: 10px; margin-top:10px;"
        		}).appendTo($hold);
        		addCalendar(myDataObj.get.dates(), $cal);

        		// add the weight column
        		let $weight = $('<div>', {
        			class: "col-xs-12 col-sm-3",
        			style: "margin-bottom: 10px; margin-top:10px;"
        		}).append($("<div>", {
        			class: "h-100 bg-light border rounded-3",
        			style: "padding:10px"
        		}).append(makeWeight(myDataObj.get.weight()))).appendTo($hold);

        		$hold = $('<div>', {
        			class: "row",
        			style: "margin-bottom: 10px; margin-top:10px;"
        		}).appendTo($div);
        		
        		myDataObj.get.movement()
	        		.forEach(lift => buildDashboardElement(lift, $hold));
        	}
        }).appendTo(btndiv);

        // console.log('get days', myDataObj.get.days());

        // workout views
        byDay.forEach(function (dayObj) {
        	let day = dayObj.day
        	makeButton('Day ' + day, function () {
        		$div.show();
	        	$workout.hide();

        		if (state !== 'Day ' + day) {
	        		$div.empty();	
	        		state = 'Day ' + day;

	        		// build the UI elements
	        		dayObj.movements.forEach(lift => buildWorkoutElement(lift));

	        		addWorkoutButton(dayObj);
	        	}
        	}, "font-weight:bold;color: " + dayObj.color).appendTo(btndiv);

        });

        setTimeout(function () {$dashBtn.click()}, 500);
    };

    let addWorkoutButton = function (dayObj) {
    	let $main = $('#main');
    	let $workout = $('#workout');

    	//setting this up so multiple submits cannot happen
    	let posted = false;
    	let postData = function (data) {
			post(data).then(function (res) {
				$('main').children().empty();
				$('#workout')
					.show()
					.html('<div class="jumbotron jumbotron-fluid"><div class="container"><h2 class="display-4">Success!</h2><p class="lead">Submitted, loading data, once done, select a button above to continue.</p></div></div>');
				getData();
			}).catch(function (err) {
				console.error(err);
				$submitBtn.removeClass("btn-primary");
				$submitBtn.attr('disabled', false);
				$submitBtn.addClass("btn-danger");
				$submitBtn.text("Failed, try again...");
				posted = false;
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
    				program: dayObj.movements.filter(a => a.movement === inputs[ind].name)[0]
    			}, $workout);
    		});

    		$submitBtn.click(function (evt) {
    			evt.preventDefault();

    			$submitBtn.text("Submitting ...");
    			$submitBtn.attr('disabled', true);
    			let formList = $workout.serializeArray();

    			//assign movement, reps, and weight per uid
    			let formEntries = {};
    			let formKeys = [];
    			formList.forEach(function (input) {
    				let name = input.name.split('_');
    				if (!formEntries.hasOwnProperty(name[1])) {
    					formEntries[name[1]] = {
    						movement: name[0]
    					};
    					formKeys.push(name[1]);
    				}
    				formEntries[name[1]][name[2]] = input.value;
    			});

    			// transform into a table
    			let submitTable = formKeys.map(function (key) {
    				//format in table is: movement;weight;date;difficulty;sets;repetitions;wkday
    				return [
    					formEntries[key].movement,
    					formEntries[key].weight,
    					(new Date()).toLocaleDateString(),
    					0, // difficulty
    					1, // sets
    					formEntries[key].reps, //reps
    					dayObj.day // selected day
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
    	let $information = $("<p>", {
    		text: move.weight + " lbs for " + move.program.sets + " sets of " + move.program.repetitions + " repetitions."
    			+ " Did " + move.program.movementObj.liftsByDate[0].work + " lbs of work in prior workout. This time will be "
    	}).appendTo($div);

    	let $thisWork = $('<span>', {
    		text: move.program.sets * move.weight * move.program.repetitions
    	}).appendTo($information);

    	$('<span>', {text: " lbs."}).appendTo($information);

    	console.log("looking here at something?", move)

    	//Add the framework for the worktable
    	let $tableDiv = $("<div>").appendTo($div);
    	let workTable = createRepTable(move.weight, move.name, move.program.sets, move.program.repetitions, $thisWork);
    	workTable.table.appendTo($tableDiv)

    	// Add the "add a row button"
    	$('<button>', {
    		type: "button",
    		class: "btn btn-outline-info",
    		text: "Add Row"
    	}).click(function (evt) {
    		evt.preventDefault();
    		workTable.addRow();
    	})
    	.appendTo($div);
    };

    let addComponents = function ($div, identifier, divName) {
    	//create left column
    	let $left = $('<div>', {
    		class: "col-md-12 col-lg-6",
    	}).appendTo($div);

    	// add header
    	$('<h2>', {
    		text: identifier
    	}).appendTo($left);

    	// add figure
    	$('<div>', {
    		id: divName
    	}).appendTo($left);

    	// Add data column
    	let $right = $('<div>', {
    		class: "col-md-12 col-lg-6"
    	}).appendTo($div);

    	// add horizontal line
    	$('<hr>').appendTo($div);

    	//add all data regions, and return an object
    	return $right;
    };

    const buildLiftInfoTable = (function () {
    	const liftTableMaker = function (liftInfo, buttons) {
	    	let $div = $('<div>');
	    	let $header = $("<h5>", {text: "Prior Lift (" + liftInfo.date.toLocaleDateString("en-US") + ")"});
	    	let $btnGroup = $('<div>', {
	    		class: "btn-group float-end"
	    	}).append(buttons.last).append(buttons.next).appendTo($header);

	    	let table = [["Lift", "Reps", "Weight", "1RM (Calc)"]];
	    	liftInfo.lifts.forEach(function (lift, ind) {
	    		for (let i = 0; i < lift.sets; i+= 1) {
	    			table.push([
	    				"Work set " + (ind + i + 1), 
	    				lift.repetitions,
	    				lift.weight,
	    				calculateReps(lift.weight, lift.repetitions, 1)
	    			]);
	    		}
	    	});
	    	let $table = createBootTable(table);
	    	$div.append($header);
	    	$div.append($table);
	    	return $div;
	    }
    	return function (lifts) {
	    	let $div = $('<div>');
	    	let currentIndex = 0;

	    	const buildButtons = function () {
	    		// have to scope this to allow buttons to be recreated each time they change
				let $lastBtn = $('<button>', {
		    		class: 'btn btn-sm btn-outline-secondary',
		    		html: "&#8592;"
		    	}).click(function (evt) {
		    		evt.preventDefault();

		    		//redetermine index
		    		currentIndex = Math.min(currentIndex + 1, lifts.length - 1);

		    		$div.empty();
		    		$div.append(liftTableMaker(lifts[currentIndex], buildButtons()));
		    	});

		    	let $nextBtn = $('<button>', {
		    		class: 'btn btn-sm btn-outline-secondary',
		    		html: "&#8594;"
		    	}).click(function (evt) {
		    		evt.preventDefault();

					//redetermine index
		    		currentIndex = Math.max(currentIndex - 1, 0);

		    		//Replace with new elements
		    		$div.empty();
		    		$div.append(liftTableMaker(lifts[currentIndex], buildButtons()));
		    	});

	    		return {
	    			last: $lastBtn,
	    			next: $nextBtn
	    		}
	    	}

			$div.append(liftTableMaker(lifts[currentIndex], buildButtons()));

	    	return $div;
	    };
    }());

    const buildWorkoutElement = (function () {
    	const getGoalTable = function (workoutObj) {

	    	// assign key values
	    	let $ret = $('<div>');
	    	let sets = workoutObj.sets;
	    	let reps = workoutObj.repetitions;
	    	let progress = workoutObj.progress;
	    	let movementObj = workoutObj.movementObj;
	    	
	    	// determine current goal
	    	let goalInd = 0;
	    	let current = progress.completeWorkoutWeight;
	    	let goalWeight;
	    	do {
	    		goal = movementObj.goals[goalInd];
	    		goalWeight = calculateReps(goal[oneRMKey], 1, reps);
				goalInd += 1;
	    	} while (goalInd < movementObj.goals.length && goalWeight < current)

	    	// determine lifting days to goal
	    	let daysToGoal = 0;
    		movementObj.days.forEach(function (day) {
    			daysToGoal += day.future.filter(date => date < goal.date).length;
    			// daysToGoal += Math.floor((goal.date * 1 - day.last * 1) / ONE_DAY / day.cycleLength);
    		});

    		// make sentence concerning goal
    		let toGoal = goalWeight - current;
    		let perInc = Math.ceil(toGoal / goalWeight * 1000) / 10;
    		let toGoalPerSes = Math.ceil(toGoal / daysToGoal * 10) / 10;
    		let perIncPerSes = Math.ceil(perInc / daysToGoal * 10) / 10;
    		$('<p>', {
    			text: "The current goal is to reach " + goalWeight 
    			+ " lbs for reps by " + goal.date.toLocaleDateString("en-us") 
    			+ " in " + daysToGoal + " sessions"
    			+ ". This is an increase of " +  toGoal
    			+ " lbs (" + perInc + "%)"
    			+ " or " + toGoalPerSes + " lbs ("
    			+ perIncPerSes + "%) per session."
    		}).appendTo($ret);

    		// build goal table
	    	let goalTable = [
	    		["Last", "Calc", "Min", "1.5%", "3%", "4.5%"],
	    		[
	    			current,
	    			calculateReps(progress.oneRM, 1, reps),
	    			rndHalf(current * (1 + perIncPerSes / 100)),
	    			rndHalf(current * 1.015),
					rndHalf(current * 1.03),
					rndHalf(current * 1.045)
	    		]
	    	];

	    	$ret.append(createBootTable(goalTable));

	    	return {
	    		default: rndHalf(current * (1 + perIncPerSes / 100)),
	    		table: $ret
	    	};
	    };

    	return function (workoutObj) {
			// console.log(workoutObj);

			const identifier = workoutObj.movement;
			const divName = identifier.toLowerCase().replace(/\s/, "_");
			const movementObj = workoutObj.movementObj;

			// identify components
		  	let $div = $("#main");

		  	// add the basic components
		  	let $page = addComponents($div, identifier, divName);

		  	// create figure
		    buildFigure(movementObj, divName);

		    // build last lift table
		    let $table = buildLiftInfoTable(movementObj.liftsByDate);
		    $page.append($table);

		    //build next goal table
		    let goals = getGoalTable(workoutObj);
	        $page.append($("<h5>", {text: "Goals"}));
	        $page.append(goals.table);

	        //add in weight select form
	        let weightid = "weight" + randStr();
	        let $workoutWeight = $('<input>', {
	        	class: "form-control",
	        	type: "number",
	        	step: "0.5",
	        	inputmode: "decimal",
	        	name: identifier,
	        	id: weightid,
	        	value: goals.default
	        }).change(function () {
        		$workoutWeight.val(rndHalf($workoutWeight.val()));
        	});

	        $('<div>', {class: "mb-3"})
	        	.append($('<label>', {
	        		class: "form-label",
	        		for: weightid,
	        		html: "<b>Work Set Weight</b>"
	        	}))
	        	.append($workoutWeight)
	        	.appendTo($page);
		};
    }());

    const buildDashboardElement = (function () {

    	const getGoalTable = function (movementObj) {

	    	// start header
	    	let goalTable = [["Date", "Sessions"]];
	    	let headerOffset = 2;

	    	//determine unique rep/sets
	    	let repSets = {};
			let ind = 0;
	    	movementObj.days.forEach(function (day) {
	    		let repSetStr = day.sets + " sets of " + day.repetitions;
	    		if (repSets.hasOwnProperty(repSetStr)) {
	    			repSets[repSetStr].days.push(day.day);
	    			repSets[repSetStr].dayOrigin.push(day);
	    		} else {
	    			repSets[repSetStr] = {
	    				reps: day.repetitions,
	    				index: ind + headerOffset,
	    				days: [day.day],
	    				dayOrigin: [day]
	    			};
	    			ind += 1;
	    		}
	    	});

	    	//add in current row
	    	let currentRow = ["Current", "NA"];

	    	// find current based on unique days if applicable
	    		// also add line to header
	    	Object.keys(repSets).forEach(function(key) {
	    		// add to header
	    		goalTable[0][repSets[key].index] = key + "<br />(Day";
	    		if (repSets[key].days.length > 1) {
	        			goalTable[0][repSets[key].index] += "s";
	    		}
	    		goalTable[0][repSets[key].index] += ": " + repSets[key].days.join(", ") + ")"

	    		//now find progress, actual day does not matter as rep/sets are the same
	    		let progress = repSets[key].dayOrigin[0].progress

	    		currentRow.push(progress.completeWorkoutWeight);

	    	});

	    	// find oneRM
	    	let max1RM = 0;
			movementObj.liftsByDate
				.forEach(lift => max1RM = Math.max(max1RM, lift.oneRM));

	    	//Add 1rm header, and 1RM progress
	    	goalTable[0].push("1RM");
	    	currentRow.push(max1RM);
	    	goalTable.push(currentRow);
	    	
	    	// add in progress stuff
	    	movementObj.goals.forEach(function (goal) {
	    		let row = [
	    			goal.date.toLocaleDateString("en-US")
	    		];

	    		//calculate days to goal
	    		let daysToGoal = 0;
	    		movementObj.days.forEach(function (day) {
	    			// console.log('days to goal', day, day.future.filter(date => date < goal.date));
	    			daysToGoal += day.future.filter(date => date < goal.date).length;
	    			// Math.floor((goal.date * 1 - day.last * 1) / ONE_DAY / day.cycleLength);
	    		});
	    		row.push(daysToGoal);

	    		let maxLeft = 0;
	    		Object.keys(repSets).forEach(function(key) {
	    			//grab progress, actual day does not matter as rep/sets are the same
		    		let progress = repSets[key].dayOrigin[0].progress
	    			
	    			// determine rep/set goals
	    			let goalWeight = calculateReps(goal[oneRMKey], 1, repSets[key].reps);

	    			// calculate pounds to goal
	    			let poundsToGoal = Math.max(0, goalWeight - progress.completeWorkoutWeight);

	    			// determine max left
	    			maxLeft = Math.max(maxLeft, poundsToGoal);

	    			row.push(goalWeight + " (+" + poundsToGoal + ")");
	    		});

	    		let poundsTo1RM = Math.max(0, goal[oneRMKey] - max1RM);
	    		maxLeft = Math.max(maxLeft, poundsTo1RM);

	    		row.push(goal[oneRMKey] + " (+" + poundsTo1RM + ")");
	    		
	    		if (maxLeft <= 0) {
	    			row = row.map(a => '<span style="color: green;">' + a + '</span>');
	    		}


	    		goalTable.push(row);
	    	});

	        return createBootTable(goalTable);
	    };

    	return function (movementObj, $div) {
	    	const identifier = movementObj.movement;
	    	const divName = identifier.toLowerCase().replace(/\s/, "_");

	      	// add the basic components
	      	let $page = addComponents($div, identifier, divName);

	        // get last lift
	        //let last = movementObj.liftsByDate[0];

	        // create figure
	        buildFigure(movementObj, divName);

	        // build last lift table
	        let $table = buildLiftInfoTable(movementObj.liftsByDate);
	        $page.append($table);

	        // Determine goals by program day
	        let goalTable = getGoalTable(movementObj);
	        $page.append($("<h5>", {text: "Goals"}));
	        $page.append(goalTable);

	        return;

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
	        page.nextTable.append(createBootTable(nextTable));

	        // build next weight area
	        let weightid = "weight" + randStr();

	        // add the elements
	        $workoutWeight = $('<input>', {
	        	class: "form-control",
	        	type: "number",
	        	inputmode: "decimal",
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
	    };
    }());

    const buildFigure = function (movementObj, divName) {

    	let summaryData = movementObj.liftsByDate;
    	let oneRM = 0;
    	let cutoff = new Date((new Date()) * 1 + 32 * ONE_DAY);

    	// console.log(movementObj.days);

    	let futureDates = movementObj.days
    		.map(day => day.future)

    	if (futureDates.length) {
    		futureDates = futureDates.reduce((a, b) => a.concat(b)).filter(d => d < cutoff);
    	}

    	// console.log(movementObj.movement, futureDates);

        let figData = [
            ["Date", "1RM (Calc)", "Work", "Max Load"] //, "1.5% growth", "3% growth", "4.5% growth"]
        ];
        summaryData.forEach(function (a) {
			figData.push([
	        	a.date,
	        	a.oneRM,
	        	a.work,
				a.maxRep,
				// NaN,
				// NaN,
				// NaN
			]);
			oneRM = Math.max(oneRM, a.oneRM)
		});

        futureDates.forEach((date, ind) => figData.push([
        	date,
        	NaN,
        	NaN,
        	NaN,
        	// oneRM * Math.pow(1.015, ind + 1),
        	// oneRM * Math.pow(1.03, ind + 1),
        	// oneRM * Math.pow(1.045, ind + 1)
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
                    3: {
                    	targetAxisIndex: 0
                    }
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

    const post = function (data, postKey) {
    	postKey = postKey || posterKey;
    	let postObj = {
    		data: data,
    		key: postKey
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
	};

    //actually get things started
    google.charts.load('51', {
        'packages': ['table']
    });
    getData();
}())
