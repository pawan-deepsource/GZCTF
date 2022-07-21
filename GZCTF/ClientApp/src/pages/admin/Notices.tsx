import React, { FC, useState } from 'react'
import { Button, Center, Stack, Text } from '@mantine/core'
import { useModals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'
import { mdiCheck, mdiClose, mdiPlus } from '@mdi/js'
import Icon from '@mdi/react'
import api, { Notice } from '../../Api'
import AdminPage from '../../components/admin/AdminPage'
import NoticeEditCard from '../../components/admin/NoticeEditCard'
import NoticeEditModal from '../../components/admin/edit/NoticeEditModal'

const Notices: FC = () => {
  const { data: notices, mutate } = api.edit.useEditGetNotices({
    refreshInterval: 0,
    revalidateIfStale: false,
    revalidateOnFocus: false,
  })

  const [disabled, setDisabled] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null)

  const onPin = (notice: Notice) => {
    if (!disabled) {
      setDisabled(true)

      api.edit.editUpdateNotice(notice.id!, { ...notice, isPinned: !notice.isPinned }).then(() => {
        mutate([
          { ...notice, isPinned: !notice.isPinned },
          ...(notices?.filter((t) => t.id !== notice.id) ?? []),
        ])
        setDisabled(false)
      })
    }
  }

  const modals = useModals()
  const onDeleteNotice = (notice: Notice) => {
    if (disabled) {
      return
    }
    modals.openConfirmModal({
      title: '删除通知',
      children: <Text size="sm">你确定要删除通知 "{notice?.title ?? ''}" 吗？</Text>,
      onConfirm: () => onConfirmDelete(notice),
      centered: true,
      labels: { confirm: '删除通知', cancel: '取消' },
      confirmProps: { color: 'red' },
    })
  }

  const onConfirmDelete = (notice: Notice) => {
    api.edit
      .editDeleteNotice(notice.id!)
      .then(() => {
        showNotification({
          color: 'teal',
          message: '通知已删除',
          icon: <Icon path={mdiCheck} size={1} />,
          disallowClose: true,
        })
        mutate(notices?.filter((t) => t.id !== notice.id) ?? [])
      })
      .catch((err) => {
        showNotification({
          color: 'red',
          title: '遇到了问题',
          message: `${err.error.title}`,
          icon: <Icon path={mdiClose} size={1} />,
        })
      })
  }

  return (
    <AdminPage
      headProps={{ position: 'center' }}
      head={
          <Button
            leftIcon={<Icon path={mdiPlus} size={1} />}
            onClick={() => {
              setActiveNotice(null)
              setIsEditModalOpen(true)
            }}
          >
            新建通知
          </Button>
      }
    >
      <Stack
        spacing="lg"
        style={{
          margin: '2%',
        }}
      >
        {notices &&
          notices
            .sort((x, y) => (x.isPinned || new Date(x.time) < new Date(y.time) ? 1 : -1))
            .map((notice) => (
              <NoticeEditCard
                key={notice.id}
                notice={notice}
                onEdit={() => {
                  setActiveNotice(notice)
                  setIsEditModalOpen(true)
                }}
                onDelete={() => onDeleteNotice(notice)}
                onPin={() => onPin(notice)}
              />
            ))}

        <NoticeEditModal
          centered
          size="30%"
          title={activeNotice ? '编辑通知' : '新建通知'}
          notice={activeNotice}
          opened={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          mutateNotice={(notice: Notice) => {
            mutate([notice, ...(notices?.filter((n) => n.id !== notice.id) ?? [])])
          }}
        />
      </Stack>
    </AdminPage>
  )
}

export default Notices
