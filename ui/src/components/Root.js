import React, { Component } from 'react';
import { ConnectedRouter } from 'react-router-redux';
import { Route, Switch } from 'react-router';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import {CssBaseline} from '@material-ui/core';
import routes from '../views/routes'

export default class Root extends Component {
    render() {
        const { store, history } = this.props;

        return (
            <Provider store={store}>
                <React.Fragment>
                    <CssBaseline/>
                    <ConnectedRouter history={history}>
                        <div>
                            <Switch>
                                {routes.map((prop, key) => (<Route path={prop.path} key={key} component={prop.component} />))}
                            </Switch>
                        </div>
                    </ConnectedRouter>
                </React.Fragment>
            </Provider>
        );
    }
}

Root.propTypes = {
    store: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};