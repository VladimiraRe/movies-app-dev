import { List } from 'antd';

import CardMovie from '../CardMovie';

export default function MoviesList({ data, baseImgUrl }) {
    const { Item } = List;
    return (
        <List
            grid={{ gutter: 16, column: 2, xs: 1 }}
            pagination={{
                pageSize: 6,
            }}
            dataSource={data}
            renderItem={(item) => (
                <Item>
                    <CardMovie movie={item} baseImgUrl={baseImgUrl} />
                </Item>
            )}
        />
    );
}
