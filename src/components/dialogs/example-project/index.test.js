import React from 'react';
import {DialogContent} from './index';
import TestRenderer from 'react-test-renderer';


test('1- default', () => {
  const props = {
    onHide: () => {
    }
  };

  const renderer = TestRenderer.create(
    <DialogContent {...props}/>
  );

  expect(renderer.toJSON()).toMatchSnapshot();
});

