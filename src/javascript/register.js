document.addEventListener("DOMContentLoaded", () => {
	const form = document.querySelector("#register");

	form.addEventListener("submit", e => {
		e.preventDefault();
		const data = {};

		const inputs = e.target.querySelectorAll("input");

		for (const input of inputs) data[input.name] = input.value;

		console.log(data)

		fetch("http://localhost:3000/api/v1/users", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then(r => r.json()).then(r => {
			if (r.error) {
				console.log(r);

				document.querySelector("#errors").innerHTML = `
					<div class="ui error message">
						<ul class="ui list">
							${r.messages.map(m => `<li>${m}</li>`).join("\n")}
						</ul>
					</div>
				`
			} else {
				localStorage.user_id = r.id
				location = "index.html"
			}
		});
	});
});