function renderUser(user) {
	return `
		<img src="${user.img_url}" class="ui medium circular image">
		<br>
		<div id="profile-details">
			<div class="ui label">
				Username
				<div class="detail">
					${user.username}
				</div>
			</div>
			<div class="ui label">
				Name
				<div class="detail">
					${user.first_name} ${user.last_name}
				</div>
			</div>
		</div>
		<br>
		<button class="ui button" data-action="edit">Edit</button>
		<button class="ui negative button" data-action="logout">Logout</button>
		<h2 class="ui header">My Rooms</h2>
		<ul id="rooms-list">
		</ul>
	`
}

function renderRoom(room) {
	return `
		<li>
			<h3 class="ui header">${room.name}</h3>
			<button class="ui button" data-action="join" data-id=${room.id}>Join</button>
		</li>
	`
}

function renderPage(profile, user) {
	profile.innerHTML = renderUser(user);
	document.querySelector("#rooms-list").innerHTML = user.rooms.map(renderRoom).join("\n");
}

document.addEventListener("DOMContentLoaded", async () => {
	const user = await fetch("http://localhost:3000/api/v1/users/" + localStorage.user_id).then(r => r.json());
	const profile = document.querySelector("#profile");

	renderPage(profile, user);

	profile.addEventListener('click', e => {
		if (e.target.dataset.action === "join") {
			localStorage.current_room = e.target.dataset.id;

			location = location.pathname = "room.html";
		} else if (e.target.dataset.action === "edit") {
			profile.innerHTML = `
				<form class="ui form">
					<div class="input">
						<label for="username">Username</label>
						<input required type="text" name="username" id="username" value="${user.username}">
					</div>
					<div class="input">
						<label for="password">Password</label>
						<input required type="password" name="password" id="password">
					</div>
					<div class="input">
						<label for="first_name">First Name</label>
						<input required type="text" name="first_name" id="first_name" value="${user.first_name}">
					</div>
					<div class="input">
						<label for="last_name">Last Name</label>
						<input required type="text" name="last_name" id="last_name" value="${user.last_name}">
					</div>
					<div class="input">
						<label for="img_url">Avatar URL</label>
						<input type="text" name="img_url" id="img_url" value="${user.img_url}">
					</div>
					<div>
						<input type="submit" value="Save Changes" class="ui primary button">
					</div>
				</form>
				<button class="ui button" data-action="cancel">Cancel</button>
			`;
		} else if (e.target.dataset.action === "cancel") {
			renderPage(profile, user);
		} else if (e.target.dataset.action === "logout") {
			delete localStorage.user_id;

			location = "login.html";
		}
	});

	profile.addEventListener('submit', e => {
		e.preventDefault();
		const data = {};

		data.username = e.target.querySelector("#username").value;
		data.password = e.target.querySelector("#password").value;
		data.first_name = e.target.querySelector("#first_name").value;
		data.last_name = e.target.querySelector("#last_name").value;
		data.img_url = e.target.querySelector("#img_url").value;

		fetch("http://localhost:3000/api/v1/users/" + localStorage.user_id, {
			method: "PATCH",
			body: JSON.stringify(data)
		}).then(r => r.json())
		.then(r => {
			Object.assign(user, r);
			renderPage(profile, user);
		})
	})
})