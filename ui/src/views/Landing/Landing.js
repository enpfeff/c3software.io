import React from "react";
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from "@material-ui/core/styles/withStyles";
import Header from "../../components/Header/Header.js";
import GridContainer from '../../components/Grid/GridContainer.jsx';
import GridItem from '../../components/Grid/GridItem.jsx';
import Parallax from '../../components/Parallax/Parallax.jsx';

import landingPageStyle from "./landingStyle.jsx";

class Landing extends React.Component {
    render() {
        const { classes, ...rest } = this.props;

        return (
            <div>
                <Header
                    color="transparent"
                    routes={[]}
                    brand="C3 Software"
                    fixed
                    changeColorOnScroll={{
                        height: 400,
                        color: "white"
                    }}
                    {...rest}
                />
                <Parallax filter image={require("./img/landing-bg.jpg")}>
                    <div className={classes.container}>
                        <GridContainer>
                            <GridItem xs={12} sm={12} md={6}>
                                <h1 className={classes.title}>Hello World.</h1>
                                <h4>Some great other text its gonna be great</h4>
                            </GridItem>
                        </GridContainer>
                    </div>
                </Parallax>
                <div className={classNames(classes.main, classes.mainRaised)}>
                    <div className={classes.mockContainer}>

                    </div>
                </div>
            </div>
        )
    }
}

Landing.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(landingPageStyle)(Landing);