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
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

import { PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { Fragment } from 'react';

const renderMethods = [
	{
		label: 'Separate by comma',
		value: 'separateByComma'
	},
	{
		label: 'Separate by new line',
		value: 'separateByNewLine'
	},
	{
		label: 'Separate by space',
		value: 'separateBySpace'
	},
	{
		label: 'Unordered list',
		value: 'unorderedList'
	},
	{
		label: 'Ordered list',
		value: 'orderedList'
	},
	{
		label: 'Custom Separator',
		value: 'customSeparator'
	}
];

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */
export default function Edit(props) {
	const { attributes, setAttributes, context } = props;
	const { customFieldName, className, renderMethod, customSeparator } = attributes;
	const { postId } = context;
	const [customFieldHTML, setCustomFieldHTML] = useState('');
	const [metaKeys, setMetaKeys] = useState([]);

	const blockProps = useBlockProps();

	useEffect(() => {
		const metaKeys = async () => {

			const data = new FormData();

			data.append('action', 'custom_field_block_get_meta_keys');
			data.append('nonce', ubc_custom_field_block.nonce);

			const response = await fetch(ajaxurl, {
				method: "POST",
				credentials: 'same-origin',
				body: data
			});
			const responseJson = await response.json();

			if (responseJson.success) {
				setMetaKeys(responseJson.data);

				if ('' === customFieldName && responseJson.data.length > 0) {
					setAttributes({
						customFieldName: responseJson.data[0]
					});
				}
			}
		};

		metaKeys();
	}, []);

	useEffect(() => {
		const getCustomFieldHTML = async () => {

			const data = new FormData();

			data.append('action', 'query_block_custom_field');
			data.append('meta_key', customFieldName);
			data.append('post_id', postId);
			data.append('render_method', renderMethod);
			data.append('class_names', className);
			data.append('custom_separator', customSeparator);
			data.append('nonce', ubc_custom_field_block.nonce);

			const response = await fetch(ajaxurl, {
				method: "POST",
				credentials: 'same-origin',
				body: data
			});
			const responseJson = await response.json();

			if (false === responseJson.success) {
				setCustomFieldHTML('');
			}
			setCustomFieldHTML(responseJson.data);
		};

		getCustomFieldHTML();
	}, [customFieldName, renderMethod, className, postId, customSeparator]);

	return (
		<Fragment>
			<div
				dangerouslySetInnerHTML={{ __html: customFieldHTML }}
				className={`wp-block-custom-field ${className}`}
				{...blockProps}
			/>
			<InspectorControls>
				<PanelBody title="Settings" className='ubc-subcategory-panel-settings' initialOpen={true}>
					{metaKeys.length > 0 ? (
						<>
							<SelectControl
								label="Custom Field Name"
								value={customFieldName}
								options={metaKeys.map(key => {
									return {
										label: key,
										value: key
									};
								})}
								onChange={(newCustomFieldName) => {
									setAttributes({
										customFieldName: newCustomFieldName
									});
								}}
								__nextHasNoMarginBottom
							/>
							<SelectControl
								label="Render Method"
								value={renderMethod}
								options={renderMethods}
								onChange={(newRenderMethod) => {
									setAttributes({ renderMethod: newRenderMethod });
								}}
								__nextHasNoMarginBottom
							/>
							{ 'customSeparator' === renderMethod && (
								<TextControl
									label="Custom Separator"
									value={customSeparator}
									onChange={(newCustomSeparator) => {
										setAttributes({ customSeparator: newCustomSeparator });
									}}
									__nextHasNoMarginBottom
								/>
							)}
						</>
					) : ''
					}
				</PanelBody>
			</InspectorControls>
		</Fragment>
	);
}