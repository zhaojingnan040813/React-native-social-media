import { View, Text } from 'react-native'
import React, { useRef } from 'react'

const RichTextEditor = () => {
    const ref = useRef(null);

  return (
    <View>
        <RichEditor
            ref={(r) => ref=r}
            initialContentHTML={'Hello <b>World</b> <p>this is a new paragraph</p> <p>this is another new paragraph</p>'}
            editorInitializedCallback={() => this.onEditorInitialized()}
        />

    </View>
  )
}

export default RichTextEditor