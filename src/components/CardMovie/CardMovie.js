import { Typography, Tag, Card, Space } from 'antd';
import { v1 as uuidv1 } from 'uuid';

import './CardMovie.css';

export default function CardMovie({ movie: { title, img, date, tags, description } }) {
    const { Text, Paragraph, Title } = Typography;
    const ellipsis = {
        rows: 6,
        expandable: false,
        symbol: 'more',
    };
    const tagsArr = tags.map((tag) => {
        return (
            <Tag style={{ textTransform: 'capitalize' }} key={uuidv1()}>
                {tag}
            </Tag>
        );
    });

    return (
        <Card className='cardMovie' cover={<img alt={title} src={img} />}>
            <Title level={5}>{title}</Title>
            <Text type='secondary'>{date}</Text>
            <Space>{tagsArr}</Space>
            <Paragraph ellipsis={ellipsis}>
                <p>{description}</p>
            </Paragraph>
        </Card>
    );
}
