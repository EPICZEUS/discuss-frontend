const ws = new WebSocket("ws://localhost:3000/cable");
ws.onerror = console.error;

ws.onopen = () => {
	ws.send(JSON.stringify({
		command: "subscribe",
		identifier: JSON.stringify({
			channel: "ChatChannel",
			id: localStorage.current_room
		})
	}));
}

ws.onmessage = async msg => {
	const data = JSON.parse(msg.data)
	if (data.type !== "ping") {
		console.log(msg, data)
	}

	if (data.type === "confirm_subscription") {
		ws.send(JSON.stringify({
			command: "message",
			identifier: JSON.stringify({
				channel: "ChatChannel",
				id: localStorage.current_room
			}),
			data: JSON.stringify({ 
				user_id: localStorage.user_id,
				action: "join"
			})
		}));
	}

	if (!data.message) return

	const comments = document.querySelector("#comment-container")
	
	if (data.message.type === "message") {
		comments.innerHTML += await renderComment(data.message.message);
		comments.scrollTop = comments.scrollHeight
	} else if (data.message.type === "userJoin") {
		const room = await fetch("http://localhost:3000/api/v1/rooms/" + localStorage.current_room).then(r => r.json());
		const userList = document.querySelector("#user-list");

		userList.innerHTML = room.users.sort((a, b) => a.username.localeCompare(b.username)).map(renderUser).join("\n");
	} else if (data.message.type === "messageDelete") {
		comments.querySelector("#comment-" + data.message.id).remove();
	} else if (data.message.type === "messageEdit") {
		comments.querySelector("#content-" + data.message.id).textContent = data.message.content
	} else if (data.message.type === "userUpdate") {
		document.querySelector("#user-" + data.message.user.id).innerHTML = `
			<img class="ui avatar image" src="${data.message.user.img_url}">
			<span>${data.message.user.username}</span>
		`

		document.querySelectorAll(".name-" + data.message.user.id).forEach(div => div.textContent = data.message.user.username)
	} else if (data.message.type === "userLeave") {
		document.querySelector("#user-" + data.message.user).remove();
	}
}

function formatDate(date) {
	return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} at ${date.getHours() % 12 || 12}:${("0" + date.getMinutes()).slice(-2)} ${date.getHours() >= 12 ? "PM" : "AM"}`
}

function renderUser(user) {
	return `
		<div id="user-${user.id}">
			<img class="ui avatar image" src="${user.img_url}">
			<span>${user.username}</span>
		</div>
	`
}

async function renderComment(msg) {
	const created = new Date(msg.created_at);
	const user = msg.user_id ? await fetch("http://localhost:3000/api/v1/users/" + msg.user_id).then(r => r.json()) : msg.user

	return `
	<div class="comment" id="comment-${msg.id}">
		<a class="avatar">
			<img src=${user.img_url}>
		</a>
		<div class="content">
			<a class="author name-${user.id}">${user.username}</a>
			<div class="metadata">
				<span class="date">${formatDate(created)}</span>
			</div>
			<div class="text" id="content-${msg.id}">${msg.content}</div>
			<div class="actions">
			${localStorage.user_id == user.id ? `
				<a class="edit" data-action="edit" data-id="${msg.id}">Edit</a>
				<a class="delete" data-action="delete" data-id=${msg.id}>Delete</a>
			` : ""}
			</div>
		</div>
	</div>
	`;
}

document.addEventListener("DOMContentLoaded", async () => {
	const room = await fetch("http://localhost:3000/api/v1/rooms/" + localStorage.current_room).then(r => r.json());
	console.log(room);
	document.querySelector("#room-name").textContent = room.name;

	const container = document.querySelector("#main-container");
	const comments = document.querySelector("#comment-container");
	// const commentForm = document.querySelector("#comment-form");
	const users = document.querySelector("#user-list");

	users.innerHTML += room.users.sort((a, b) => a.username.localeCompare(b.username)).map(renderUser).join("\n");

	comments.innerHTML = (await Promise.all(room.messages.sort((a, b) => a.created_at.localeCompare(b.created_at)).map(renderComment))).join("\n");
	comments.scrollTop = comments.scrollHeight;

	container.addEventListener('submit', async e => {
		e.preventDefault();

		if (e.target.dataset.action === "send"){
			const content = e.target.querySelector("#content-input").value;

			ws.send(JSON.stringify({
				command: "message",
				identifier: JSON.stringify({
					channel: "ChatChannel",
					id: localStorage.current_room
				}),
				data: JSON.stringify({
					action: "message",
					content,
					user_id: localStorage.user_id
				})
			}));

			e.target.reset();
		} else if (e.target.dataset.action === "edit") {
			const msg = await fetch(`http://localhost:3000/api/v1/rooms/${localStorage.current_room}/messages/${e.target.dataset.id}`).then(r => r.json());
			const content = comments.querySelector("#content-" + e.target.dataset.id);
			const value = comments.querySelector("#content-input-" + e.target.dataset.id).value;

			if (msg.content === value) {
				content.textContent = msg.content;
				return;
			}

			ws.send(JSON.stringify({
				command: "message",
				identifier: JSON.stringify({
					channel: "ChatChannel",
					id: localStorage.current_room
				}),
				data: JSON.stringify({
					action: "edit",
					id: e.target.dataset.id,
					content: value
				})
			}))
		}
	});

	comments.addEventListener('click', e => {
		if (e.target.dataset.action === "edit") {
			const content = comments.querySelector("#content-" + e.target.dataset.id);
			content.innerHTML = `
			<form class="ui form" data-action="edit" data-id="${e.target.dataset.id}">
				<div class="ui input edit">
					<input type="text" id="content-input-${e.target.dataset.id}" value="${content.textContent}"></input>
				</div>
			</form>
			`
		} else if (e.target.dataset.action === "delete") {
			if (confirm("Are you sure?")) {
				ws.send(JSON.stringify({
					command: "message",
					identifier: JSON.stringify({
						channel: "ChatChannel",
						id: localStorage.current_room
					}),
					data: JSON.stringify({
						action: "delete",
						id: e.target.dataset.id
					})
				}));
			}
		}
	})

	document.querySelector("#leave").addEventListener("click", e => {
		console.log("oh hi mark")
		ws.send(JSON.stringify({
			command: "message",
			identifier: JSON.stringify({
				channel: "ChatChannel",
				id: localStorage.current_room
			}),
			data: JSON.stringify({
				action: "leave",
				user_id: localStorage.user_id
			})
		}));

		location = "index.html"
	})
});