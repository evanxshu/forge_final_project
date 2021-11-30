const url = 'https://api.devhub.virginia.edu/v1/courses';
fetch(url)
	.then((resp) => resp.json())
	.then(function(data) {
    	
		let big_object = data.class_schedules
		

		console.log(big_object)






	}).catch(function(error) {
		console.log('Fetch failed!');
	});