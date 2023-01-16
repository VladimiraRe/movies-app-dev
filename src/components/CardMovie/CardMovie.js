import { Typography, Tag, Card, Space, Skeleton } from 'antd';
import { v1 as uuidv1 } from 'uuid';
import { intlFormat, parseISO } from 'date-fns';

import './CardMovie.css';

export default function CardMovie({ movie: { title, poster, date, description }, baseImgUrl }) {
    const { Text, Paragraph, Title } = Typography;
    const ellipsis = {
        rows: 6,
        expandable: false,
        symbol: 'more',
    };
    const tags = ['action', 'drama'];
    const tagsArr = tags.map((tag) => {
        return (
            <Tag style={{ textTransform: 'capitalize' }} key={uuidv1()}>
                {tag}
            </Tag>
        );
    });

    let cover;

    if (baseImgUrl === false) {
        cover = <Skeleton.Image className='cardMovie__skeletonImg' />;
    } else {
        cover = <img alt={title} src={baseImgUrl + poster} />;
    }

    let formatDate = parseISO(date);
    formatDate = intlFormat(formatDate, { month: 'short', day: 'numeric', year: 'numeric' }, { locale: 'en-US' });

    return (
        <Card style={{ height: '279px' }} className='cardMovie' cover={cover}>
            <Title level={5}>{title}</Title>
            <Text type='secondary'>{formatDate}</Text>
            <Space>{tagsArr}</Space>
            <Paragraph ellipsis={ellipsis}>
                <p>{description}</p>
            </Paragraph>
        </Card>
    );
}
