const url = 'https://api.devhub.virginia.edu/v1/courses';
fetch(url)
	.then((resp) => resp.json())
	.then(function(data) {
    	
		const big_array = data.class_schedules.records
		const with_meeting_days = big_array.filter(course => course[8] != "")
		const fall2021_array = with_meeting_days.filter(course => course[12] == "2021 Fall")

		function range(start, stop, step) {
			if (typeof stop == 'undefined') {
				// one param defined
				stop = start;
				start = 0;
			}
		
			if (typeof step == 'undefined') {
				step = 1;
			}
		
			if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
				return [];
			}
		
			var result = [];
			for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
				result.push(i);
			}
		
			return result;
		};
		
		function findDays(course) {
			if (course[8].includes("M")) {
				weeklyCourses["M"].push(course)
			} 

			if (course[8].includes("T")) {
				weeklyCourses["T"].push(course)
			} 

			if (course[8].includes("W")) {
				weeklyCourses["W"].push(course)
			} 

			if (course[8].includes("R")) {
				weeklyCourses["R"].push(course)
			} 

			if (course[8].includes("F")) {
				weeklyCourses["F"].push(course)
			} 

		}

		function sortEachDay(dailyarray) {
			blockArray = dailyarray.map(course => timeToBlocks(course[9], course[10]))
			return blockArray
		}

		function countOneDayBlocks(dailyBlockArray) {
			dailyObj = {}
			for (let i = 1; i <= 168; i++){
				dailyObj[i] = 0
			}
			dailyBlockArray.forEach(course => {
				course.forEach(block => ++dailyObj[block])
			})

			return dailyObj
		}

		weeklyCourses = {
			M: [],
			T: [],
			W: [],
			R: [],
			F: []
		}

		function timeToBlocks(start, end) {
			let start_array = start.split(':'); // split it at the colons
			let end_array = end.split(':')

			// hours are 12 blocks. minutes are divided into 5 and are worth one block.
			// Subtract 95 because we are starting at 8:00:00, but we want 8:00:00-8:05:00 to be the first block
			let start_block = 0
			if ((+start_array[0]) < 8) {
				start_block = (+start_array[0] +12) * 12 + Math.round((+start_array[1])/5) - 95
			} else {
				start_block = (+start_array[0]) * 12 + Math.round((+start_array[1])/5) - 95
			}

			if ((+end_array[0]) < 8) {
				end_block = (+end_array[0] +12) * 12 + Math.round((+end_array[1])/5) - 95
			} else {
				end_block = (+end_array[0]) * 12 + Math.round((+end_array[1])/5) - 95
			}
			if (range(start_block,end_block) == []){
				console.log(start,end)
				console.log(start_block,end_block)
			}
			return range(start_block, end_block)
		}
		
		weeklyBlocks = {}
		finalBlocksByWeek = {}
		function compileEverything(array) {
			array.forEach(findDays) // organizes all classes by day in weekly courses
			Object.keys(weeklyCourses).forEach((day) => {
				blocksForEachClass = sortEachDay(weeklyCourses[day])
				weeklyBlocks[day]= blocksForEachClass

			})

			daysOfTheWeek = ["M", "T", "W", "R", "F"]
			daysOfTheWeek.forEach((day) =>{
				finalBlocksByWeek[day] = countOneDayBlocks(weeklyBlocks[day])
			})

			daysOfTheWeek.forEach((day) =>{
				Object.keys(finalBlocksByWeek[day]).forEach((block) =>{
					if (block >168){
						delete finalBlocksByWeek[day][block]
					}
				})
			})
		}


		compileEverything(fall2021_array)
		console.log(finalBlocksByWeek)

		// DRAWING THE GRAPH

		// set the dimensions and margins of the graph
		const margin = {top: 30, right: 30, bottom: 30, left: 30},
			width = 450 - margin.left - margin.right,
			height = 450 - margin.top - margin.bottom,
			columnSize = Math.floor(width/5),
			days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];


		//append svg
		let svg = d3.select('#dataviz')
					.append('svg')
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
					.style("border", "1px solid grey")
					.append("g")
					.attr("transform",
        					"translate(" + margin.left + "," + margin.top + ")");
		
		

	}).catch(function(error) {
		console.log('Fetch failed!');
	});

