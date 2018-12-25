function renderRoom(room) {
	return `
		<li id="${room.id}">
			<h3>${room.name}</h3>
			<button class="ui button" data-id="${room.id}" data-action="join">Join</button>
		</li>
	`
}

document.addEventListener("DOMContentLoaded", async () => {
	const rooms = document.querySelector("#rooms-list");
	const data = await fetch("http://localhost:3000/api/v1/rooms").then(r => r.json());
	rooms.innerHTML = data.map(renderRoom).join("\n");

	rooms.addEventListener('click', e => {
		if (e.target.dataset.action === "join") {
			localStorage.current_room = e.target.dataset.id;

			location = "room.html";
		}
	});
});