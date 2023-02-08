import { Component } from 'react';
import { Alert } from 'antd';

export default class ErrorBoundary extends Component {
    state = {
        isErrors: false,
    };

    componentDidCatch() {
        this.setState({ isErrors: true });
    }

    render() {
        const { isErrors } = this.state;
        const { children, component } = this.props;

        const content =
            component === 'list' ? (
                <Alert message='Oops' description='Sorry, something is wrong. Please try again later' type='error' />
            ) : null;

        return isErrors ? content : children;
    }
}
