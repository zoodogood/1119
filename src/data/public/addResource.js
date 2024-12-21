import { ActionsMap } from "#src/user/actions/actionsMap.enum.js";

export function addResource({
	resource,
	user,
	value,
	source,
	context,
	executor,
}) {
	if (Number.isNaN(value)) {
		throw new Error(`Add NaN resource count`, {
			details: { source, resource },
		});
	}

	if (!source) {
		throw new Error();
	}

	user.action(ActionsMap.resourceChange, {
		value,
		executor,
		source,
		resource,
		context,
	});
	user.data[resource] ||= 0;
	user.data[resource] += value;
}

export function addMultipleResources({
	resources,
	user,
	source,
	context,
	executor,
}) {
	const addResourceOptions = { user, source, context, executor };
	for (const [resource, value] of Object.entries(resources)) {
		addResource({
			...addResourceOptions,
			resource,
			value,
		});
	}
}
