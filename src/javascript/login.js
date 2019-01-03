document.addEventListener("DOMContentLoaded", () => {
	const form = document.querySelector("#login-form");
	const errors = document.querySelector("#errors");

	errors.addEventListener("click", e => {
		if (e.target.dataset.action === "close") {
			errors.innerHTML = "";
			errors.style.display = "none";
		}
	})

	form.addEventListener('submit', e => {
		e.preventDefault();
		const username = form.querySelector("#username").value;
		const password = form.querySelector("#password").value;

		fetch("http://localhost:3000/api/v1/login", {
			headers: {
				'Authorization': `${username}:${password}`
			}
		}).then(r => r.json()).then(r => {
			if (r.status === 200) {
				localStorage.user_id = r.id;
				location = "index.html";
			} else {
				errors.innerHTML = `
					<i class="close icon" data-action="close"></i>
					<div class="header">
						Incorrect Username or Password
					</div>
				`;

				errors.style.display = "";
			}
		});
	})
})