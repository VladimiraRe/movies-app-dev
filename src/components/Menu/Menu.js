import { Menu as AntdMenu } from 'antd';

import './Menu.css';

export default function Menu({ type, onClick }) {
    const items = [
        {
            label: 'Search',
            key: 'popular',
        },
        {
            label: 'Rated',
            key: 'rated',
        },
    ];
    const selected = type !== 'rated' ? 'popular' : type;

    return (
        <AntdMenu
            onClick={({ key }) => onClick(key)}
            className='menu'
            mode='horizontal'
            selectedKeys={[selected]}
            items={items}
        />
    );
}
