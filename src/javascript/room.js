const headers = {
	'Accept': 'application/json',
	'Content-Type': 'application/json'
}

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

	if (data.type === "ping") return;

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

	if (!data.message) return;

	const comments = document.querySelector("#comment-container");
	
	if (data.message.type === "message") {
		comments.innerHTML += await renderComment(data.message.message);
		comments.scrollTop = comments.scrollHeight;
	} else if (data.message.type === "userJoin") {
		const room = await fetch("http://localhost:3000/api/v1/rooms/" + localStorage.current_room).then(r => r.json());
		const userList = document.querySelector("#user-list");

		userList.innerHTML = room.users.sort((a, b) => a.username.localeCompare(b.username)).map(renderUser).join("\n");
	} else if (data.message.type === "messageDelete") {
		comments.querySelector("#comment-" + data.message.id).remove();
	} else if (data.message.type === "messageUpdate") {
		comments.querySelector("#content-" + data.message.message.id).innerHTML = data.message.message.content.replace(/https?:\/\/([^:\/\s]+)(www\.)?([\w\-\.]+[^#?\s]+).*?(#[\w\-]+)?\b/g, '<a href="$&">$&</a>')
		comments.querySelector("#likes-" + data.message.message.id).textContent = data.message.message.likes
		comments.querySelector("#like-word-" + data.message.message.id).textContent = data.message.message.likes === 1 ? "Like" : "Likes"
	} else if (data.message.type === "userUpdate") {
		document.querySelector("#user-" + data.message.user.id).innerHTML = `
			<img class="ui bordered avatar image" src="${data.message.user.img_url}">
			<span>${data.message.user.username}</span>
		`

		document.querySelectorAll(".name-" + data.message.user.id).forEach(div => div.textContent = data.message.user.username)
	} else if (data.message.type === "userLeave") {
		document.querySelector("#user-" + data.message.user).remove();
	} else if (data.message.type === "roomDelete") {
		delete localStorage.current_room;
		location = "index.html";
	} else if (data.message.type === "presenceUpdate") {
		const icon = document.querySelector("#icon-" + data.message.user)

		if (icon) {
			if (data.message.status === "online") {
				icon.className = "user icon"
			} else {
				icon.className = "user outline icon"
			}
		}
	}
}

function formatDate(date) {
	return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} at ${date.getHours() % 12 || 12}:${("0" + date.getMinutes()).slice(-2)} ${date.getHours() >= 12 ? "PM" : "AM"}`
}

function renderUser(user) {
	return `
		<div id="user-${user.id}">
			<img class="ui bordered avatar image" src="${user.img_url}">
			<i class="user ${user.current_room === localStorage.current_room && user.status === "online" ? "outline" : ""} icon" id="icon-${user.id}"></i>
			<span>${user.username}</span>
		</div>
	`
}

function renderError(r) {
	return `
		<div class="ui error message" style="margin-top: 10px;">
			<div class="header">
				There was a problem with your message
			</div>
			<ul class="ui list">
				${r.messages.map(m => `<li>${m}</li>`)}
			</ul>
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
					<div class="date">${formatDate(created)}</div>
			        <div class="rating">
						<i class="black thumbs up icon"></i>
						<span id="likes-${msg.id}">${msg.likes || "No"}</span> <span id="like-word-${msg.id}">Like${msg.likes !== 1 ? "s" : ""}</span>
			        </div>
				</div>
				<div class="text" id="content-${msg.id}">${msg.content.replace(/https?:\/\/([^:\/\s]+)(www\.)?([\w\-\.]+[^#?\s]+).*?(#[\w\-]+)?\b/g, '<a href="$&">$&</a>')}</div>
				<div class="actions">
				${localStorage.user_id == user.id ? `
					<a class="edit" data-action="edit" data-id="${msg.id}">Edit</a>
					<a class="delete" data-action="delete" data-id=${msg.id}>Delete</a>
				` : `<a class="like" data-action="like" data-id=${msg.id}>Like</a>`}
				</div>
			</div>
		</div>
	`;
}

document.addEventListener("DOMContentLoaded", async () => {
	$("#comment-form.ui.form").form({
		fields: {
			content: {
				rules: [
					{
						type: "empty",
						prompt: "Cannot send an empty message"
					},
					{
						type: "maxLength[2000]",
						prompt: "Message cannot be longer than 2000 characters"
					}
				]
			}
		}
	}).submit(e => e.preventDefault());

	const room = await fetch("http://localhost:3000/api/v1/rooms/" + localStorage.current_room).then(r => r.json());

	document.querySelector("#room-name").textContent = room.name;

	const container = document.querySelector("#main-container");
	const comments = document.querySelector("#comment-container");
	// const commentForm = document.querySelector("#comment-form");
	const users = document.querySelector("#user-list");
	const button = document.querySelector("#button");

	users.innerHTML += room.users.sort((a, b) => a.username.localeCompare(b.username)).map(renderUser).join("\n");

	comments.innerHTML = (await Promise.all(room.messages.sort((a, b) => a.created_at.localeCompare(b.created_at)).map(renderComment))).join("\n");
	comments.scrollTop = comments.scrollHeight;

	button.innerHTML = `
		<button class="ui negative button room-action" data-action=${room.owner.id === Number(localStorage.user_id) ? '"delete">Delete' : '"leave">Leave'} Room</button>
	`

	container.addEventListener('submit', async e => {
		e.preventDefault();

		if (e.target.dataset.action === "send"){
			let content = e.target.querySelector("#content-input").value;

			if (/^\/giphy/.test(content)) {
				let q = content.split(/ +/).slice(1).join(" ");


				if (q.trim()) {
					const { data: [ giphy ]} = await fetch("http://api.giphy.com/v1/gifs/search?api_key=JGBJ8ev5KS5tKw6AgUszgqOy1KT68lJf&q=" + q).then(r => r.json())

					content = giphy.url
				} else {
					return e.target.reset();
				}
			}

			// ws.send(JSON.stringify({
			// 	command: "message",
			// 	identifier: JSON.stringify({
			// 		channel: "ChatChannel",
			// 		id: localStorage.current_room
			// 	}),
			// 	data: JSON.stringify({
			// 		action: "message",
			// 		content,
			// 		user_id: localStorage.user_id
			// 	})
			// }));

			fetch(`http://localhost:3000/api/v1/rooms/${localStorage.current_room}/messages`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					user_id: localStorage.user_id,
					content
				})
			});

			e.target.reset();
		} else if (e.target.dataset.action === "edit") {
			fetch(`http://localhost:3000/api/v1/rooms/${localStorage.current_room}/messages/${e.target.dataset.id}`).then(r => r.json()).then(msg => {
				const content = comments.querySelector("#content-" + e.target.dataset.id);
				const value = comments.querySelector("#content-input-" + e.target.dataset.id).value;

				if (msg.content.replace(/https?:\/\/([^:\/\s]+)(www\.)?([\w\-\.]+[^#?\s]+).*?(#[\w\-]+)?\b/g, '<a href="$&">$&</a>') === value) {
					content.innerHTLM = msg.content.replace(/https?:\/\/([^:\/\s]+)(www\.)?([\w\-\.]+[^#?\s]+).*?(#[\w\-]+)?\b/g, '<a href="$&">$&</a>');
					return;
				}

				// ws.send(JSON.stringify({
				// 	command: "message",
				// 	identifier: JSON.stringify({
				// 		channel: "ChatChannel",
				// 		id: localStorage.current_room
				// 	}),
				// 	data: JSON.stringify({
				// 		action: "edit",
				// 		id: e.target.dataset.id,
				// 		content: value
				// 	})
				// }))

				if (value) {
					fetch(`http://localhost:3000/api/v1/rooms/${localStorage.current_room}/messages/${e.target.dataset.id}`, {
						method: "PATCH",
						headers,
						body: JSON.stringify({
							content: value
						})
					}).then(r => r.json()).then(r => {
						if (r.error) {
							content.textContent = msg.content;
						}
					});
				} else if (confirm("Are you sure?")) {
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
			});
		}
	});

	comments.addEventListener('click', e => {
		if (e.target.dataset.action === "edit") {
			const content = comments.querySelector("#content-" + e.target.dataset.id);
			content.innerHTML = `
			<form class="ui form" data-action="edit" data-id="${e.target.dataset.id}">
				<div class="input edit">
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
		} else if (e.target.dataset.action === "like") {
			const likeSpan = document.querySelector("#likes-" + e.target.dataset.id);
			const likes = (Number(likeSpan.textContent) || 0) + 1;

			fetch(`http://localhost:3000/api/v1/rooms/${localStorage.current_room}/messages/${e.target.dataset.id}`, {
				method: "PATCH",
				headers,
				body: JSON.stringify({
					likes
				})
			})
		}
	})

	button.addEventListener("click", e => {
		if (e.target.dataset.action === "leave") {
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
		} else if (e.target.dataset.action === "delete" && confirm("Are you sure?")) {
			fetch("http://localhost:3000/api/v1/rooms/" + localStorage.current_room, {
				method: "DELETE"
			});
		}

		delete localStorage.current_room;
		location = "index.html"
	})
});

window.addEventListener("beforeunload", () => {
	ws.send(JSON.stringify({
		command: "message",
		identifier: JSON.stringify({
			channel: "ChatChannel",
			id: localStorage.current_room
		}),
		data: JSON.stringify({
			action: "exit",
			user_id: localStorage.user_id
		})
	}))
})
