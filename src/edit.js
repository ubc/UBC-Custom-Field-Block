/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

import { PanelBody, SelectControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { Fragment } from 'react';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */
export default function Edit( props ) {
	const { attributes, setAttributes, context } = props;
	const { customFieldName, className } = attributes;
	const { postId } = context;
	const [ customFieldValue, setCustomFieldValue ] = useState('');
	const [ metaKeys, setMetaKeys ] = useState([]);

	useEffect(() => {
		const metaKeys = async() => {

			const data = new FormData();

			data.append( 'action', 'custom_field_block_get_meta_keys' );
			data.append( 'nonce', ubc_custom_field_block.nonce );

			const response = await fetch( ajaxurl, {
			  method: "POST",
			  credentials: 'same-origin',
			  body: data
			} );
			const responseJson = await response.json();
			
			if( responseJson.success ) {
				setMetaKeys( responseJson.data );

				if( '' === customFieldName && responseJson.data.length > 0 ) {
					setAttributes({
						customFieldName: responseJson.data[0]
					});
				}
			}
		};

		metaKeys();
	}, []);

	useEffect(() => {
		const getCustomFieldValue = async() => {

			const data = new FormData();

			data.append( 'action', 'query_block_custom_field' );
			data.append( 'meta_key', customFieldName );
			data.append( 'post_id', postId );
			data.append( 'nonce', ubc_custom_field_block.nonce );
		
			const response = await fetch( ajaxurl, {
			  method: "POST",
			  credentials: 'same-origin',
			  body: data
			} );
			const responseJson = await response.json();
			
			if( false === responseJson.success ) {
				setCustomFieldValue( '' );
			}
			setCustomFieldValue( responseJson.data );
		};

		getCustomFieldValue();
	}, [ customFieldName ]);

	return (
		<Fragment>
			<div
				dangerouslySetInnerHTML={ { __html: customFieldValue } }
				className={`wp-block-custom-field ${className}`}
			/>
			<InspectorControls>
				<PanelBody title="Settings" className='ubc-subcategory-panel-settings' initialOpen={ true }>
					{ metaKeys.length > 0 ? (
						<SelectControl
							label="Custom Field Name"
							value={ customFieldName }
							options={ metaKeys.map(key => {
								return {
									label: key,
									value: key
								};
							}) }
							onChange={ ( newCustomFieldName ) => {
								setAttributes({
									customFieldName: newCustomFieldName
								});
							} }
							__nextHasNoMarginBottom
						/>
					) : 'dw'
					}
				</PanelBody>
			</InspectorControls>
		</Fragment>
	);
}