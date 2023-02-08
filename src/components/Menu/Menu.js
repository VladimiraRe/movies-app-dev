import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Menu as AntdMenu } from 'antd';

import './Menu.css';

export default class Menu extends PureComponent {
    static defaultProps = {
        type: 'popular',
        isNeedDisable: false,
        onClick: () => null,
    };

    static propTypes = {
        type: PropTypes.string,
        isNeedDisable: PropTypes.bool,
        onClick: PropTypes.func,
    };

    render() {
        const { type, onClick, className, isNeedDisable } = this.props;
        const selected = type !== 'rated' ? 'popular' : type;
        let menuClass = 'menu';
        if (className) menuClass += ` ${className}`;

        const items = [
            {
                label: 'Search',
                key: 'popular',
            },
            {
                label: 'Rated',
                key: 'rated',
                disabled: isNeedDisable,
            },
        ];

        return (
            <AntdMenu
                onClick={({ key }) => onClick(key)}
                className={menuClass}
                mode='horizontal'
                selectedKeys={[selected]}
                items={items}
            />
        );
    }
}
