<template>
	<div>
		<tabs>
			<tab name="First tab">
				<tabs :options="{ useUrlFragment: false }">
					<tab name="Tab A">
						Tab A content
					</tab>
					<tab name="Tab B">
						Tab A content
					</tab>
					<tab name="Tab C">
						Tab A content
					</tab>
				</tabs>
			</tab>
			<tab name="Second tab">
				Second tab content
			</tab>
			<tab name="Third tab">
				Third tab content
			</tab>
		</tabs>
	</div>
</template>

<script>
export default {
	name: 'ViewTab',
};
</script>
