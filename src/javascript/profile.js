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
					${user.first_name ? `${user.first_name} ${user.last_name}` : "N/A"}
				</div>
			</div>
		</div>
		<br>
		<button class="ui button" data-action="edit">Edit</button>
		<button class="ui negative button" data-action="logout">Logout</button>
		<div class="ui two column grid container" id="user-rooms">
			<div class="ui four wide column">
				<h3 class="ui header">My Rooms</h3>
				<ul class="ui list" id="my-rooms">
				</ul>
			</div>
			<div class="ui four wide column">
				<h3 class="ui header">Rooms I'm In</h3>
				<ul class="ui list" id="rooms-list">
				</ul>
			</div>
		</div
	`
}

function renderRoom(room) {
	return `
		<li>
			<h4><a href="room.html" data-action="join" data-id=${room.id}>${room.name}</a></h4>
		</li>
	`
}

function renderPage(profile, user) {
	profile.innerHTML = renderUser(user);
	document.querySelector("#my-rooms").innerHTML = user.owned_rooms.map(renderRoom).join("\n");
	document.querySelector("#rooms-list").innerHTML = user.rooms.filter(r => !user.owned_rooms.some(o => o.id === r.id)).map(renderRoom).join("\n");
}

document.addEventListener("DOMContentLoaded", async () => {
	const user = await fetch("http://localhost:3000/api/v1/users/" + localStorage.user_id).then(r => r.json());
	const profile = document.querySelector("#profile");

	renderPage(profile, user);

	profile.addEventListener('click', e => {
		if (e.target.dataset.action === "join") {
			localStorage.current_room = e.target.dataset.id;
		} else if (e.target.dataset.action === "edit") {
			profile.innerHTML = `
				<div class="ui negative message" id="errors" style="display: none;">
				</div>
				<form class="ui form">
					<div class="input">
						<label for="username">Username</label>
						<input type="text" name="username" id="username" value="${user.username}">
					</div>
					<div class="input">
						<label for="password">Password</label>
						<input type="password" name="password" id="password">
					</div>
					<div class="input">
						<label for="first_name">First Name</label>
						<input type="text" name="first_name" id="first_name" value="${user.first_name}">
					</div>
					<div class="input">
						<label for="last_name">Last Name</label>
						<input type="text" name="last_name" id="last_name" value="${user.last_name}">
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
		} else if (e.target.dataset.action === "close") {
			const errors = document.querySelector("#errors");

			errors.innerHTML = "";
			errors.style.display = "none";
		}
	});

	profile.addEventListener('submit', e => {
		e.preventDefault();
		const data = {};

		const inputs = e.target.querySelectorAll("input");

		for (const input of inputs) {
			data[input.name] = input.value;
		}

		fetch("http://localhost:3000/api/v1/users/" + localStorage.user_id, {
			method: "PATCH",
			body: JSON.stringify(data)
		}).then(r => r.json()).then(r => {
			const errors = document.querySelector("#errors");

			if (r.error) {
				if (r.status === 403) {
					errors.innerHTML = `
						<i class="close icon" data-action="close"></i>
						<div class="header">Incorrect Password</div>
					`
				} else {
					errors.innerHTML = `
						<i class="close icon" data-action="close"></i>
						<div class="header">There was a problem with updating your user</div>
						<ul class="ui list">
							${r.messages.map(m => `<li>${m}</li>`).join("\n")}
						</ul>
					`
				}

				errors.style.display = "";
			} else {
				Object.assign(user, r);
				renderPage(profile, user);
			}
		})
	})
})