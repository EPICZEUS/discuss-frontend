if (!Number(localStorage.user_id)) {
	location = "login.html";
} else {
	fetch("http://localhost:3000/api/v1/users/" + localStorage.user_id)
		.then(r => r.json())
		.then(r => {
			document.querySelector("#profile-info").innerHTML += `
				<span id="rooms-link"><a href="index.html">Rooms</a></span>
				<a href="profile.html">
					<img class="ui avatar image" src="${r.img_url}">
				</a>
			`
		});
}