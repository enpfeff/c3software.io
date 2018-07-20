import React from 'react';
import {CssBaseline, Typography, Grid, Paper} from '@material-ui/core';
// import PropTypes from 'prop-types';
import '../styles/app.scss';
import {connect} from 'react-redux';

const styles = {
    root: {
        flexGrow: 1,
        flexDirection: 'column',
        paddingTop: 5
    },
    inner: {
        padding: 8,
        flexGrow: 1,
        flexDirection: 'column'
    }
};

class App extends React.Component {

    render() {
        return (
            <React.Fragment>
                <CssBaseline/>
                <div style={styles.root}>
                    <Grid container style={styles.root} spacing={16}>
                        <Grid item>
                            <Paper>
                                <Grid container style={styles.inner} spacing={16}>
                                    <Grid item>
                                        <Typography variant="headline" component="h3">
                                            Hello World
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                </div>
            </React.Fragment>
        );
    }
}

App.propTypes = {};
const mapProps = () => ({});

export default connect(mapProps)(App);