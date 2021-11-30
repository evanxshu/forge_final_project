const url = 'https://api.devhub.virginia.edu/v1/courses';
fetch(url)
	.then((resp) => resp.json())
	.then(function(data) {
    	
		const big_array = data.class_schedules.records
		const with_meeting_days = big_array.filter(course => course[8] != "")

		console.log(with_meeting_days)






	}).catch(function(error) {
		console.log('Fetch failed!');
	});