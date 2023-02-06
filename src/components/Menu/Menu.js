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
        const { type, onClick } = this.props;
        const selected = type !== 'rated' ? 'popular' : type;

        return (
            <AntdMenu
                onClick={({ key }) => onClick(key)}
                className='menu'
                mode='horizontal'
                selectedKeys={[selected]}
                items={this.items}
            />
        );
    }
}
