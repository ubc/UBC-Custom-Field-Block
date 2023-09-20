<?php
/**
 * Plugin Name:       UBC Custom Field Block
 * Description:       Display custom field for a specific post.
 * Requires at least: 5.9
 * Requires PHP:      7.0
 * Version:           1.0.0
 * Author:            Kelvin Xu
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ubc-custom-field-block

 * @package Ubc_Custom_Field_Block
 */

namespace UBC\CTLT\BLOCKS\CUSTOM_FIELD;

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see    https://developer.wordpress.org/reference/functions/register_block_type/
 * @return void
 */
function init() {
	add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\\localize_to_editor_script' );

	register_block_type(
		__DIR__ . '/build',
		array(
			'render_callback' => __NAMESPACE__ . '\\render_custom_field',
		)
	);
}

/**
 * Localize PHP variables to editor script.
 */
function localize_to_editor_script() {
	wp_localize_script(
		'ubc-custom-field-block-editor-script',
		'ubc_custom_field_block',
		array(
			'nonce' => wp_create_nonce( 'custom_field_block_ajax' ),
		)
	);
}

/**
 * ServerSideRendering callback to render the content of the block.
 *
 * @param array  $attributes block attributes.
 * @param HTML   $content content of the block.
 * @param Object $block current registered block object.
 * @return HTML raw content of the block.
 */
function render_custom_field( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) || ! isset( $attributes['customFieldName'] ) ) {
		return;
	}

	$post_id     = intval( $block->context['postId'] );
	$meta_key    = sanitize_text_field( $attributes['customFieldName'] );
	$class_names = isset( $attributes['className'] ) ? esc_attr( $attributes['className'] ) : '';

	$metadata = get_metadata( 'post', $post_id, $meta_key, true );

	if ( false === $metadata ) {
		return;
	}

	if ( '' === trim( $meta_key ) ) {
		return;
	}

	return sprintf( "<div class='wp-block-custom-field %s'>%s</div>", $class_names, $metadata );
}//end render_custom_field()

add_action( 'wp_ajax_query_block_custom_field', __NAMESPACE__ . '\\get_query_block_custom_field' );

/**
 * Ajax request handler to return the post meta value based on post id and meta key.
 *
 * @return void
 */
function get_query_block_custom_field() {

	wp_verify_nonce( $_POST['nonce'], 'custom_field_block_ajax' );

	if ( ! isset( $_POST['post_id'] ) || ! isset( $_POST['meta_key'] ) ) {
		wp_send_json_error( 'Missing required informations for the request.' );
	}

	$post_id  = intval( $_POST['post_id'] );
	$meta_key = sanitize_text_field( wp_unslash( $_POST['meta_key'] ) );

	$metadata = get_metadata( 'post', $post_id, $meta_key, true );

	if ( false === $metadata ) {
		wp_send_json_error();
	}

	if ( '' === trim( $meta_key ) ) {
		wp_send_json_error();
	}

	wp_send_json_success( $metadata );
}

add_action( 'wp_ajax_custom_field_block_get_meta_keys', __NAMESPACE__ . '\\get_meta_keys' );

/**
 * Ajax request handler to return the list of meta keys from the post meta table.
 *
 * @return void
 */
function get_meta_keys() {
	global $wpdb;

	wp_verify_nonce( $_POST['nonce'], 'custom_field_block_ajax' );

	$keys = get_transient( 'wp_metadata_get_keys' );
	if ( false !== $keys ) {
		wp_send_json_success( $keys );
	}

	$keys = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT DISTINCT meta_key
			FROM $wpdb->postmeta
			WHERE meta_key NOT BETWEEN '_' AND '_z'
			HAVING meta_key NOT LIKE %s
			ORDER BY meta_key",
			$wpdb->esc_like( '_' ) . '%'
		)
	);

	set_transient( 'wp_metadata_get_keys', $keys, HOUR_IN_SECONDS );

	wp_send_json_success( $keys );
}//end get_meta_keys()

add_action( 'updated_post_meta', __NAMESPACE__ . '\\reset_metakeys_transient' );

/**
 * Delete `wp_metadata_filter_get_keys` transient when any of the post metas is updated.
 */
function reset_metakeys_transient() {
	if ( false !== get_transient( 'wp_metadata_get_keys' ) ) {
		delete_transient( 'wp_metadata_get_keys' );
	}
}//end reset_metakeys_transient()


/* --------------------------------------------------------------------------------------------------------------------------------------------------- */

add_action( 'init', __NAMESPACE__ . '\\init' );
