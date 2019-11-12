const os = require("os");
const fs = require("fs");
const mqtt = require("mqtt");
const path = require("path");
const execa = require("execa");
const homedir = os.homedir();
const appdir = path.resolve(homedir, ".pisahub");
const appfile = path.resolve(appdir, "uuid");
const uuid = require("uuid/v1");
// const printer = require("printer");

if (!fs.existsSync(appdir)) {
	fs.mkdirSync(appdir);
}

if (!fs.existsSync(appfile)) {
	fs.writeFileSync(appfile, uuid());
}

const id = fs.readFileSync(appfile).toString();
console.log("printer id : " + id);
const client = mqtt.connect("tcp://mqtt.pisahub.com");

const heroChannel = "public/" + id + "/hero";
const herobackChannel = "public/" + id + "/heroback";
client.subscribe(heroChannel, { qos: 0 });

client.on("message", function(topic, payload) {
	if (heroChannel == topic) {
		(async () => {
			try {
				payload = JSON.parse(payload.toString());
				let result = null;
				if (payload.command) {
					result = await execa.command(
						payload.command,
						payload.options
					);
				} else {
					result = await execa(
						payload.file,
						payload.commands,
						payload.options
					);
				}

				client.publish(herobackChannel, JSON.stringify(result));
			} catch (error) {
				client.publish(herobackChannel, JSON.stringify(error));
			}
		})();
	}
	console.log(payload);
});
console.log("listening");
