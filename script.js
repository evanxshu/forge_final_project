const url = 'https://api.devhub.virginia.edu/v1/courses';

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
	return range(start_block, end_block)
}

const zeroPad = (num, places) => {
	const numZeroes = places - num.toString().length + 1;
	if (numZeroes > 0) {
	  return Array(+numZeroes).join("0") + num;
	}
	return num
  }

function blockToTime (block) {
	let hours = Math.floor(parseInt(block)/12)
	let minutes = ((parseInt(block)) - hours*12)*5
	let padHours = zeroPad(hours+8, 2)
	let padMinutes = zeroPad(minutes, 2)
	return `${padHours}:${padMinutes}:00`
}

function blockToRange (block) {
	return blockToTime(block) + "-" + blockToTime(parseInt(block)+1)
}

function acronymToDay (letter) {
	switch (letter){
		case 'M':
			return 'Monday';
		case 'T':
			return 'Tuesday';
		case 'W':
			return 'Wednesday';
		case 'R':
			return 'Thursday';
		case 'F':
			return 'Friday'
	}
}


fetch(url)
	.then((resp) => resp.json())
	.then(function(data) {
    	
		const big_array = data.class_schedules.records
		const with_meeting_days = big_array.filter(course => course[8] != "")
		const fall2021_array = with_meeting_days.filter(course => course[12] == "2021 Fall")
	
		// check specific start times with these comments:
		// const monday = fall2021_array.filter(course => course[8].includes("M"))
		// console.log(monday.filter(course => course[9] == ""))


		weeklyCourses = {
			M: [],
			T: [],
			W: [],
			R: [],
			F: []
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


		final_array = []
		daysOfTheWeek = ["M", "T", "W", "R", "F"]
		daysOfTheWeek.forEach((day)=>{
			Object.keys(finalBlocksByWeek[day]).forEach((block) =>{
				let new_triplet = [day,block,finalBlocksByWeek[day][block]]
				final_array.push(new_triplet)
			})
		})


		console.log(finalBlocksByWeek)
		// DRAWING THE GRAPH

		// set the dimensions and margins of the graph
		const margin = {top: 30, right: 30, bottom: 30, left: 60},
			width = 1000 - margin.left - margin.right,
			height = 700 - margin.top - margin.bottom,
			times = ["8AM", "9AM", "10AM", "11AM", "Noon", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM"],
			days = ["M", "T", "W", "R", "F"];


		//append svg
		let svg = d3.select('#dataviz')
					.append('svg')
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
					.style("border", "1px solid grey")
					.append("g")
					.attr("transform",
        					"translate(" + margin.left + "," + margin.top + ")");
		
		
		
		//Build xScale
		let xScale = d3.scaleBand()
				.range([0,width])
				.domain(days)
				.padding(0.05);
		
		let xAxis = d3.axisBottom(xScale)
		let xTickLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
		xAxis.tickFormat((d,i) => xTickLabels[i])
			svg.append('g')
				.attr('transform', `translate(0, ${height})`)
				.call(xAxis)
			
		//Build yScale
		let yScale = d3.scaleBand()
				.range([height,0])
				.domain(range(168, 0, -1))
				.padding(0);
			
		let yAxis = d3.axisLeft(yScale);

		svg.append('g')
				.call(yAxis.tickValues(range(0,169,12)).tickFormat((d,i) => times[i]))
			

		//Color Scale
		const keys = ["M", "T", "W", "R", "F"]
		max_values = []
		keys.forEach((key) =>{
			let arr = Object.values(finalBlocksByWeek[key])
			let max = Math.max(...arr)
			max_values.push(max);
		})
		let real_max = Math.max(...max_values)


		let color = d3.scaleSequential()
			.domain([0, real_max])
			.interpolator(d3.interpolateMagma);
		

		const tooltip = d3.select('body').append('div')
			.attr('id', 'tooltip')
			.style('position', 'absolute')
			.style('font-size', '10px')
			.style("z-index", "10")
			.style('border', '0px')
			.style('border-radius', '8px')
			.style('padding', '10px')
			.style('text-align', 'center')
			.style('background', 'white')
			.style('opacity', 0)
			.style('pointer-events', 'none')

		//add the data rects!
		svg.selectAll("rect")
			.data(final_array)
			.enter()
			.append("rect")
				.attr('x', (d) => xScale(d[0]))
				.attr('y', (d) => yScale(d[1]))
				.attr('width', xScale.bandwidth())
				.attr('height', yScale.bandwidth())
				.style('fill', (d) => color(d[2]))
				.on("mouseover", function(){
					d3.select(this).style('opacity', 0.5)
					thisData = d3.select(this).data()[0]
					tooltip.html(acronymToDay(thisData[0]) + '</br>' + blockToRange(thisData[1]-1)
					+ '</br>' + `There are ${thisData[2]} classes </br> taking place at this time`)
					.style('opacity', 0.85)
				})
				.on('mouseout', function(){
					d3.select(this).style('opacity', 1)
					tooltip.style('opacity', 0)
				})
				.on('mousemove', function(event){
					tooltip.style('left', d3.pointer(event)[0]+20 + 'px')
					tooltip.style('top', d3.pointer(event)[1]+20 + 'px')
				})
	}).catch(function(error) {
		console.log('Fetch failed!');
	});

