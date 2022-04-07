import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Demo from './demo';

const App = () => {
  return (
    <div>
      <Demo />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
