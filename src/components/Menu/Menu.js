import { Component } from 'react';
import PropTypes from 'prop-types';
import { Menu as AntdMenu } from 'antd';

import './Menu.css';

export default class Menu extends Component {
    static defaultProps = {
        type: 'popular',
        onClick: () => null,
    };

    static propTypes = {
        type: PropTypes.string,
        onClick: PropTypes.func,
    };

    items = [
        {
            label: 'Search',
            key: 'popular',
        },
        {
            label: 'Rated',
            key: 'rated',
        },
    ];

    render() {
        const { type, onClick, className } = this.props;
        const selected = type !== 'rated' ? 'popular' : type;
        let menuClass = 'menu';
        if (className) menuClass += ` ${className}`;

        return (
            <AntdMenu
                onClick={({ key }) => onClick(key)}
                className={menuClass}
                mode='horizontal'
                selectedKeys={[selected]}
                items={this.items}
            />
        );
    }
}
