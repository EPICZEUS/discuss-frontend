ws.onopen = () => {
	ws.send(JSON.stringify({
		command: "subscribe",
		identifier: JSON.stringify({
			channel: "RoomChannel"
		})
	}));
}

ws.onmessage = msg => {
	const { message } = JSON.parse(msg.data);

	if (!message) return

	if (message.type === "roomCreate") {
		document.querySelector("#rooms-list").innerHTML += renderRoom(message.room);
	} else if (message.type === "roomDelete") {
		document.querySelector("#li-" + message.id).remove();
	}
}

function renderRoom(room) {
	return `
		<li id="li-${room.id}">
			<h4><a href="room.html" data-id="${room.id}" data-action="join">${room.name}</a></h4>
		</li>
	`
}

document.addEventListener("DOMContentLoaded", async () => {
	const rooms = document.querySelector("#rooms-list");
	const errors = document.querySelector("#errors");
	const data = await fetch("http://localhost:3000/api/v1/rooms").then(r => r.json());
	const form = document.querySelector("#room-form");
	rooms.innerHTML = data.map(renderRoom).join("\n");

	rooms.addEventListener('click', e => {
		if (e.target.dataset.action === "join") {
			localStorage.current_room = e.target.dataset.id;
		}
	});
	
	errors.addEventListener("click", e => {
		if (e.target.dataset.action === "close") {
			errors.innerHTML = "";
			errors.style.display = "none"
		}
	})

	form.addEventListener("submit", e => {
		e.preventDefault();
		fetch("http://localhost:3000/api/v1/rooms", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: form.querySelector("input").value,
				owner_id: localStorage.user_id
			})
		}).then(r => r.json()).then(r => {
			if (r.error) {
				errors.innerHTML = `
					<i class="close icon" data-action="close"></i>
					<div class="header">
						There was an error with making a room
					</div>
					<ul class="ui list">
						${r.messages.map(m => `<li>${m}</li>`)}
					</ul>
				`
				errors.style.display = "";
			} else {
				localStorage.current_room = r.id;
				location = "room.html";
			}
		});
	});
});