document.addEventListener("DOMContentLoaded", () => {
	const form = document.querySelector("#login-form");

	form.addEventListener('submit', e => {
		e.preventDefault();
		const username = form.querySelector("#username").value;
		const password = form.querySelector("#password").value;

		fetch("http://localhost:3000/api/v1/login", {
			headers: {
				username,
				password
			}
		}).then(r => r.json()).then(r => {
			if (r.id) {
				localStorage.user_id = r.id
				location = "index.html";
			}
		});
	})
})